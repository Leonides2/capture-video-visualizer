//! Captura nativa con nokhwa: listado de dispositivos/formatos y el hilo de captura.

mod encoder;
mod stats;

use std::{
    cmp::Ordering as CmpOrdering,
    sync::{
        atomic::{AtomicBool, Ordering},
        mpsc::{self, RecvTimeoutError, SyncSender},
        Arc, Mutex, PoisonError,
    },
    thread::{self, JoinHandle},
    time::{Duration, Instant},
};

use nokhwa::{
    pixel_format::RgbFormat,
    query,
    utils::{
        ApiBackend, CameraFormat, CameraIndex, FrameFormat, RequestedFormat, RequestedFormatType,
        Resolution,
    },
    Camera,
};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::stream_server::{self, JpegFrame};
use encoder::FrameEncoder;
use stats::StatsWindow;

pub const EVENT_STATS: &str = "capture-stats";
pub const EVENT_ERROR: &str = "capture-error";

const JPEG_QUALITY: u8 = 80;
const START_TIMEOUT: Duration = Duration::from_secs(10);
/// Errores seguidos de `frame()` antes de avisar a la UI (~1 s con la espera entre reintentos).
const ERROR_REPORT_THRESHOLD: u32 = 20;
const ERROR_RETRY_DELAY: Duration = Duration::from_millis(50);
/// Tiempo para que el SO libere la cámara antes de reabrirla (evita bugs de MediaFoundation).
const RELEASE_DELAY: Duration = Duration::from_millis(200);
const MIN_LISTED_FPS: u32 = 5;
const MIN_FALLBACK_FPS: u32 = 15;

const CODECS: [FrameFormat; 6] = [
    FrameFormat::MJPEG,
    FrameFormat::YUYV,
    FrameFormat::NV12,
    FrameFormat::GRAY,
    FrameFormat::RAWRGB,
    FrameFormat::RAWBGR,
];

#[derive(Serialize)]
pub struct DeviceInfo {
    id: u32,
    name: String,
    description: String,
}

#[derive(Serialize, PartialEq)]
pub struct FormatInfo {
    width: u32,
    height: u32,
    fps: u32,
    format: String,
}

impl From<CameraFormat> for FormatInfo {
    fn from(format: CameraFormat) -> Self {
        Self {
            width: format.resolution().width(),
            height: format.resolution().height(),
            fps: format.frame_rate(),
            format: codec_name(format.format()).to_string(),
        }
    }
}

/// Formato pedido por la UI. Sin `codec` se busca el mejor formato compatible.
pub struct FormatRequest {
    pub width: u32,
    pub height: u32,
    pub fps: u32,
    pub codec: Option<FrameFormat>,
}

pub fn codec_name(format: FrameFormat) -> &'static str {
    match format {
        FrameFormat::MJPEG => "MJPEG",
        FrameFormat::YUYV => "YUYV",
        FrameFormat::NV12 => "NV12",
        FrameFormat::GRAY => "GRAY",
        FrameFormat::RAWRGB => "RAWRGB",
        FrameFormat::RAWBGR => "RAWBGR",
    }
}

pub fn parse_codec(name: &str) -> Option<FrameFormat> {
    CODECS.into_iter().find(|codec| codec_name(*codec) == name)
}

fn any_format() -> RequestedFormat<'static> {
    RequestedFormat::new::<RgbFormat>(RequestedFormatType::None)
}

fn exact_format(format: CameraFormat) -> RequestedFormat<'static> {
    RequestedFormat::new::<RgbFormat>(RequestedFormatType::Exact(format))
}

fn is_mjpeg(format: &CameraFormat) -> bool {
    format.format() == FrameFormat::MJPEG
}

fn pixels(format: &CameraFormat) -> u32 {
    format.resolution().width() * format.resolution().height()
}

/// Orden del listado: MJPEG primero (no se recodifica), luego resolución y fps descendentes.
fn by_preference(a: &CameraFormat, b: &CameraFormat) -> CmpOrdering {
    is_mjpeg(b)
        .cmp(&is_mjpeg(a))
        .then(pixels(b).cmp(&pixels(a)))
        .then(b.frame_rate().cmp(&a.frame_rate()))
}

/// Orden cuando no se encontró el formato pedido: MJPEG, luego fps y resolución.
fn by_fallback_preference(a: &CameraFormat, b: &CameraFormat) -> CmpOrdering {
    is_mjpeg(b)
        .cmp(&is_mjpeg(a))
        .then(b.frame_rate().cmp(&a.frame_rate()))
        .then(pixels(b).cmp(&pixels(a)))
}

// --- Dispositivos y formatos ---

pub fn list_devices() -> Vec<DeviceInfo> {
    let Ok(cameras) = query(ApiBackend::Auto) else {
        return Vec::new();
    };
    cameras
        .into_iter()
        .map(|info| DeviceInfo {
            // El índice es el id; los backends con id de texto caen en 0.
            id: match info.index() {
                CameraIndex::Index(i) => *i,
                CameraIndex::String(_) => 0,
            },
            name: info.human_name(),
            description: info.description().to_string(),
        })
        .collect()
}

pub fn list_formats(index: u32) -> Result<Vec<FormatInfo>, String> {
    let mut camera = Camera::new(CameraIndex::Index(index), any_format())
        .map_err(|e| format!("Failed to initialize camera: {e:?}"))?;
    let mut formats = camera
        .compatible_camera_formats()
        .map_err(|e| format!("Could not retrieve compatible formats: {e:?}"))?;

    formats.retain(|f| f.frame_rate() >= MIN_LISTED_FPS);
    formats.sort_by(by_preference);

    let mut list: Vec<FormatInfo> = formats.into_iter().map(FormatInfo::from).collect();
    list.dedup();
    Ok(list)
}

// --- Sesión de captura ---

struct CaptureSession {
    stop: Arc<AtomicBool>,
    thread: JoinHandle<()>,
}

impl CaptureSession {
    fn shutdown(self) {
        self.stop.store(true, Ordering::Release);
        let _ = self.thread.join();
    }
}

/// Solo hay un hilo de captura a la vez; el lock también serializa start/stop concurrentes.
static SESSION: Mutex<Option<CaptureSession>> = Mutex::new(None);

/// Arranca la captura y espera a que la cámara entregue el stream.
/// Devuelve el formato realmente activo (puede diferir del pedido si no estaba disponible).
pub fn start(app: AppHandle, index: u32, request: FormatRequest) -> Result<FormatInfo, String> {
    let mut session = SESSION.lock().unwrap_or_else(PoisonError::into_inner);
    if let Some(previous) = session.take() {
        previous.shutdown();
    }
    stream_server::clear();

    let stop = Arc::new(AtomicBool::new(false));
    let (ready_tx, ready_rx) = mpsc::sync_channel(1);
    let thread = thread::Builder::new()
        .name("camera-capture".into())
        .spawn({
            let stop = stop.clone();
            move || run_capture(app, index, request, stop, ready_tx)
        })
        .map_err(|e| format!("Failed to spawn capture thread: {e}"))?;
    let new_session = CaptureSession { stop, thread };

    match ready_rx.recv_timeout(START_TIMEOUT) {
        Ok(Ok(active)) => {
            *session = Some(new_session);
            Ok(active)
        }
        Ok(Err(err)) => {
            new_session.shutdown();
            Err(err)
        }
        Err(RecvTimeoutError::Disconnected) => {
            new_session.shutdown();
            Err("Capture thread exited unexpectedly".into())
        }
        Err(RecvTimeoutError::Timeout) => {
            // El hilo sigue bloqueado abriendo la cámara: se marca para que termine
            // por su cuenta en cuanto pueda, sin bloquear esta llamada.
            new_session.stop.store(true, Ordering::Release);
            Err("Timed out waiting for the camera to start".into())
        }
    }
}

pub fn stop() {
    let previous = SESSION
        .lock()
        .unwrap_or_else(PoisonError::into_inner)
        .take();
    if let Some(session) = previous {
        session.shutdown();
    }
}

fn run_capture(
    app: AppHandle,
    index: u32,
    request: FormatRequest,
    stop: Arc<AtomicBool>,
    ready: SyncSender<Result<FormatInfo, String>>,
) {
    let (mut camera, requested) = match open_camera(index, &request) {
        Ok(opened) => opened,
        Err(err) => {
            let _ = ready.send(Err(err));
            return;
        }
    };
    if let Err(e) = camera.open_stream() {
        let _ = ready.send(Err(format!("Failed to open camera stream: {e:?}")));
        return;
    }

    // nokhwa (MSMF) lee mal los fps de `camera_format()` (devuelve el denominador de
    // la fracción, normalmente 1), así que se reporta el formato exacto que se pidió.
    let active = requested.unwrap_or_else(|| camera.camera_format());
    eprintln!("Camera stream running! Format: {active:?}");
    let _ = ready.send(Ok(FormatInfo::from(active)));

    let mut encoder = FrameEncoder::new(JPEG_QUALITY);
    let mut stats = StatsWindow::new(is_mjpeg(&active));
    let mut seq = 0;
    let mut consecutive_errors = 0;

    while !stop.load(Ordering::Acquire) {
        match camera.frame() {
            Ok(buffer) => {
                consecutive_errors = 0;
                let started = Instant::now();
                match encoder.encode(&buffer) {
                    Ok(data) => {
                        seq += 1;
                        stats.record(started.elapsed(), data.len());
                        stream_server::publish(JpegFrame { seq, data });
                    }
                    Err(e) => eprintln!("Failed to encode frame: {e}"),
                }
            }
            Err(e) => {
                consecutive_errors += 1;
                eprintln!("Error getting frame: {e:?}");
                if consecutive_errors == ERROR_REPORT_THRESHOLD {
                    let _ = app.emit(
                        EVENT_ERROR,
                        format!("La capturadora dejó de enviar video: {e}"),
                    );
                }
                thread::sleep(ERROR_RETRY_DELAY);
            }
        }

        if let Some(report) = stats.take_report() {
            let _ = app.emit(EVENT_STATS, report);
        }
    }

    let _ = camera.stop_stream();
    stream_server::clear();
}

/// Abre la cámara directamente con el formato pedido; si no se puede, busca uno compatible.
/// Devuelve también el formato exacto con el que se abrió (`None` = el del driver).
fn open_camera(
    index: u32,
    request: &FormatRequest,
) -> Result<(Camera, Option<CameraFormat>), String> {
    let camera_index = CameraIndex::Index(index);

    if let Some(codec) = request.codec {
        let requested = CameraFormat::new(
            Resolution::new(request.width, request.height),
            codec,
            request.fps,
        );
        match Camera::new(camera_index.clone(), exact_format(requested)) {
            Ok(camera) => return Ok((camera, Some(requested))),
            Err(e) => {
                eprintln!(
                    "Requested format {requested:?} rejected ({e:?}). Searching a compatible one."
                );
                thread::sleep(RELEASE_DELAY);
            }
        }
    }

    open_best_effort(camera_index, request)
}

/// Abre la cámara sin exigencias, elige el formato más cercano al pedido y la reabre con él.
fn open_best_effort(
    index: CameraIndex,
    request: &FormatRequest,
) -> Result<(Camera, Option<CameraFormat>), String> {
    let mut camera = Camera::new(index.clone(), any_format())
        .map_err(|e| format!("Failed to initialize camera: {e:?}"))?;

    let Some(chosen) = choose_format(&mut camera, request) else {
        // Sin lista de formatos: se usa el que el driver entregue por defecto.
        return Ok((camera, None));
    };

    drop(camera);
    thread::sleep(RELEASE_DELAY);
    let camera = Camera::new(index, exact_format(chosen))
        .map_err(|e| format!("Failed to re-initialize camera with format {chosen:?}: {e:?}"))?;
    Ok((camera, Some(chosen)))
}

fn choose_format(camera: &mut Camera, request: &FormatRequest) -> Option<CameraFormat> {
    let formats = match camera.compatible_camera_formats() {
        Ok(formats) => formats,
        Err(e) => {
            eprintln!("Could not retrieve compatible formats: {e:?}");
            return None;
        }
    };

    let exact = formats
        .iter()
        .copied()
        .filter(|f| {
            f.resolution().width() == request.width
                && f.resolution().height() == request.height
                && f.frame_rate() == request.fps
        })
        .min_by(by_preference);
    if exact.is_some() {
        return exact;
    }

    eprintln!(
        "Did not find format {}x{}@{}fps. Falling back to the best available.",
        request.width, request.height, request.fps
    );
    formats
        .into_iter()
        .filter(|f| f.frame_rate() >= MIN_FALLBACK_FPS)
        .min_by(by_fallback_preference)
}
