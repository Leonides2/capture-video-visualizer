use axum::{
    body::Body,
    http::{header, Response, StatusCode},
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::stream::Stream;
use image::DynamicImage;
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
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::sync::broadcast;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;

lazy_static::lazy_static! {
    // A channel to broadcast JPEG frames to all connected HTTP clients
    static ref FRAME_tx: broadcast::Sender<Vec<u8>> = {
        let (tx, _) = broadcast::channel(16);
        tx
    };

    // Store the active camera thread to stop it when changing devices
    static ref ACTIVE_CAMERA: Arc<Mutex<Option<std::thread::JoinHandle<()>>>> = Arc::new(Mutex::new(None));
    static ref CAMERA_RUNNING: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

#[derive(Serialize)]
pub struct DeviceInfo {
    id: u32,
    name: String,
    description: String,
}

#[derive(Serialize)]
pub struct FormatInfo {
    width: u32,
    height: u32,
    fps: u32,
    format: String,
}

pub fn get_devices() -> Vec<DeviceInfo> {
    let mut devices = Vec::new();
    if let Ok(cams) = query(ApiBackend::Auto) {
        for info in cams {
            // we use the index as a unique ID
            let id = match info.index() {
                CameraIndex::Index(i) => *i,
                CameraIndex::String(ref _s) => 0, // Fallback, not great but works for many cases
            };
            devices.push(DeviceInfo {
                id,
                name: info.human_name(),
                description: info.description().to_string(),
            });
        }
    }
    devices
}

pub fn get_camera_formats(camera_index: u32) -> Result<Vec<FormatInfo>, String> {
    let index = CameraIndex::Index(camera_index);
    let format = RequestedFormat::new::<RgbFormat>(RequestedFormatType::None);
    let mut camera = match Camera::new(index, format) {
        Ok(c) => c,
        Err(e) => return Err(format!("Failed to initialize camera: {:?}", e)),
    };

    let mut format_list = Vec::new();
    if let Ok(mut formats) = camera.compatible_camera_formats() {
        formats.retain(|f| f.frame_rate() >= 5); // Permitir algunos fps bajos por si acaso

        for f in formats {
            format_list.push(FormatInfo {
                width: f.resolution().width(),
                height: f.resolution().height(),
                fps: f.frame_rate(),
                format: match f.format() {
                    FrameFormat::MJPEG => "MJPEG".to_string(),
                    FrameFormat::YUYV => "YUYV".to_string(),
                    _ => format!("{:?}", f.format()),
                },
            });
        }

        // Ordenar por MJPEG, resolución y fps desc
        format_list.sort_by(|a, b| {
            let a_is_mjpeg = a.format == "MJPEG";
            let b_is_mjpeg = b.format == "MJPEG";
            let a_res = a.width * a.height;
            let b_res = b.width * b.height;

            b_is_mjpeg
                .cmp(&a_is_mjpeg)
                .then(b_res.cmp(&a_res))
                .then(b.fps.cmp(&a.fps))
        });

        // Remover duplicados
        format_list.dedup_by(|a, b| {
            a.width == b.width && a.height == b.height && a.fps == b.fps && a.format == b.format
        });
    }
    Ok(format_list)
}

pub fn start_camera(camera_index: u32, width: u32, height: u32, fps: u32) -> Result<(), String> {
    // Stop the previous camera if any
    stop_camera();

    // Mark as running
    {
        let mut running = CAMERA_RUNNING.lock().unwrap();
        *running = true;
    }

    let tx = FRAME_tx.clone();

    let handle = std::thread::spawn(move || {
        let index = CameraIndex::Index(camera_index);

        // Inicializar sin exigencias para que la cámara abra sí o sí (modo consulta)
        let format = RequestedFormat::new::<RgbFormat>(RequestedFormatType::None);
        let mut camera = match Camera::new(index.clone(), format) {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Failed to initialize camera even with None: {:?}", e);
                return;
            }
        };

        let mut best_format_opt = None;

        // Solicitar manualmente los formatos que la cámara soporta
        if let Ok(formats) = camera.compatible_camera_formats() {
            eprintln!("Supported formats count: {}", formats.len());

            // Buscar match EXACTO con los parámetros de UI
            let mut exact_matches = formats.clone();
            exact_matches.retain(|f| {
                f.resolution().width() == width
                    && f.resolution().height() == height
                    && f.frame_rate() == fps
            });

            if !exact_matches.is_empty() {
                // Si hay varios match exactos (ej. MJPEG y YUYV), preferimos MJPEG
                exact_matches.sort_by(|a, b| {
                    let a_is_mjpeg = a.format() == FrameFormat::MJPEG;
                    let b_is_mjpeg = b.format() == FrameFormat::MJPEG;
                    b_is_mjpeg.cmp(&a_is_mjpeg)
                });
                best_format_opt = Some(exact_matches[0]);
                eprintln!("Found requested EXACT format: {:?}", exact_matches[0]);
            } else {
                eprintln!(
                    "Did not find exact format for {}x{}@{}fps. Falling back to highest available.",
                    width, height, fps
                );
                let mut fallback_formats = formats;
                // Filtrar y ordenar como antes
                fallback_formats.retain(|f| f.frame_rate() >= 15);
                if !fallback_formats.is_empty() {
                    fallback_formats.sort_by(|a, b| {
                        let a_is_mjpeg = a.format() == FrameFormat::MJPEG;
                        let b_is_mjpeg = b.format() == FrameFormat::MJPEG;
                        let a_res = a.resolution().width() * a.resolution().height();
                        let b_res = b.resolution().width() * b.resolution().height();

                        b_is_mjpeg
                            .cmp(&a_is_mjpeg)
                            .then(b.frame_rate().cmp(&a.frame_rate()))
                            .then(b_res.cmp(&a_res))
                    });

                    best_format_opt = Some(fallback_formats[0]);
                    eprintln!("Manually picked fallback format: {:?}", fallback_formats[0]);
                } else {
                    eprintln!("No adequate fast formats found (>15fps).");
                }
            }
        } else {
            eprintln!("Could not retrieve compatible formats.");
        }

        // Si encontramos un buen formato, recreamos la cámara exigiéndolo exactamente.
        // Esto evita los bugs de MediaFoundation al cambiar formatos en caliente.
        if let Some(best_fmt) = best_format_opt {
            drop(camera); // Liberar el recurso del SO
            std::thread::sleep(Duration::from_millis(200)); // Darle tiempo a Windows para liberar el handler

            let exact_format =
                RequestedFormat::new::<RgbFormat>(RequestedFormatType::Exact(best_fmt));
            camera = match Camera::new(index, exact_format) {
                Ok(c) => c,
                Err(e) => {
                    eprintln!("Failed to re-initialize camera with exact format: {:?}", e);
                    return;
                }
            };
        }

        if let Err(e) = camera.open_stream() {
            eprintln!("Failed to open camera stream: {:?}", e);
            return;
        }

        eprintln!(
            "Camera stream running! Format: {:?}",
            camera.camera_format()
        );

        loop {
            // Check if we should stop
            {
                let running = CAMERA_RUNNING.lock().unwrap();
                if !*running {
                    break;
                }
            }

            match camera.frame() {
                Ok(frame) => {
                    let source_format = frame.source_frame_format();
                    // Fast path if camera natively produces MJPEG
                    if source_format == FrameFormat::MJPEG {
                        let raw_mjpeg = frame.buffer().to_vec();
                        let _ = tx.send(raw_mjpeg);
                    } else {
                        // We have to decode and re-encode to JPEG (expensive, but fallback)
                        match frame.decode_image::<RgbFormat>() {
                            Ok(decoded) => {
                                let mut cursor = std::io::Cursor::new(Vec::new());
                                if let Ok(_) =
                                    decoded.write_to(&mut cursor, image::ImageFormat::Jpeg)
                                {
                                    let _ = tx.send(cursor.into_inner());
                                } else {
                                    eprintln!("Failed to encode frame to JPEG");
                                }
                            }
                            Err(e) => {
                                eprintln!(
                                    "Failed to decode frame (format {:?}): {:?}",
                                    source_format, e
                                );
                            }
                        }
                    }
                }
                Err(e) => {
                    eprintln!("Error getting frame: {:?}", e);
                    std::thread::sleep(Duration::from_millis(50));
                }
            }
        }

        let _ = camera.stop_stream();
    });

    let mut active = ACTIVE_CAMERA.lock().unwrap();
    *active = Some(handle);

    Ok(())
}

pub fn stop_camera() {
    {
        let mut running = CAMERA_RUNNING.lock().unwrap();
        *running = false;
    }
    let mut handle = ACTIVE_CAMERA.lock().unwrap();
    if let Some(h) = handle.take() {
        let _ = h.join();
    }
}

// --- Axum Server for MJPEG Stream ---

async fn video_feed() -> impl IntoResponse {
    let rx = FRAME_tx.subscribe();
    let stream = BroadcastStream::new(rx).filter_map(|res| {
        match res {
            Ok(mut frame) => {
                let mut output = Vec::new();
                output.extend_from_slice(b"--frame\r\nContent-Type: image/jpeg\r\n\r\n");
                output.append(&mut frame);
                output.extend_from_slice(b"\r\n");
                Some(Ok::<_, std::convert::Infallible>(output))
            }
            Err(_) => {
                // Ignore lag errors
                None
            }
        }
    });

    let body = Body::from_stream(stream);

    Response::builder()
        .status(StatusCode::OK)
        .header(
            header::CONTENT_TYPE,
            "multipart/x-mixed-replace; boundary=frame",
        )
        .header(header::CACHE_CONTROL, "no-cache, private")
        .body(body)
        .unwrap()
}

pub fn start_server() {
    std::thread::spawn(|| {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            use tower_http::cors::{Any, CorsLayer};

            let cors = CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any);

            let app = Router::new().route("/stream", get(video_feed)).layer(cors);

            let listener = tokio::net::TcpListener::bind("127.0.0.1:18342")
                .await
                .unwrap();
            println!("Local video stream server started at http://127.0.0.1:18342/stream");
            axum::serve(listener, app).await.unwrap();
        });
    });
}
