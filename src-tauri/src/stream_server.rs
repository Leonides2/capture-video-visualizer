//! Servidor HTTP local que entrega los frames JPEG como MJPEG (`multipart/x-mixed-replace`).

use std::{
    convert::Infallible,
    sync::{
        atomic::{AtomicU64, Ordering},
        LazyLock,
    },
};

use axum::{
    body::Body,
    http::{header, StatusCode},
    response::Response,
    routing::get,
    Router,
};
use bytes::Bytes;
use futures_util::{future, stream, StreamExt};
use tokio::sync::watch;
use tokio_stream::wrappers::WatchStream;
use tower_http::cors::{Any, CorsLayer};

const STREAM_ADDR: &str = "127.0.0.1:18342";
const BOUNDARY: &str = "frame";

#[derive(Clone)]
pub struct JpegFrame {
    /// Número de secuencia dentro de la sesión de captura; permite contar frames saltados.
    pub seq: u64,
    pub data: Bytes,
}

// Solo se guarda el último frame: si un cliente va lento salta directamente
// al más reciente en vez de acumular cola (y latencia).
static LATEST_FRAME: LazyLock<watch::Sender<Option<JpegFrame>>> =
    LazyLock::new(|| watch::Sender::new(None));
static FRAMES_SERVED: AtomicU64 = AtomicU64::new(0);
static FRAMES_SKIPPED: AtomicU64 = AtomicU64::new(0);

pub fn publish(frame: JpegFrame) {
    LATEST_FRAME.send_replace(Some(frame));
}

/// Descarta el último frame y reinicia los contadores (al cambiar de sesión).
pub fn clear() {
    LATEST_FRAME.send_replace(None);
    take_delivery_counts();
}

/// Devuelve y reinicia `(servidos, saltados)` desde la última llamada.
pub fn take_delivery_counts() -> (u64, u64) {
    (
        FRAMES_SERVED.swap(0, Ordering::Relaxed),
        FRAMES_SKIPPED.swap(0, Ordering::Relaxed),
    )
}

fn multipart_chunks(frame: JpegFrame) -> [Bytes; 3] {
    let header = format!(
        "--{BOUNDARY}\r\nContent-Type: image/jpeg\r\nContent-Length: {}\r\n\r\n",
        frame.data.len()
    );
    [Bytes::from(header), frame.data, Bytes::from_static(b"\r\n")]
}

async fn video_feed() -> Response {
    let mut last_seq: Option<u64> = None;

    let body = WatchStream::new(LATEST_FRAME.subscribe())
        .filter_map(future::ready)
        .map(move |frame| {
            if let Some(prev) = last_seq {
                if frame.seq > prev + 1 {
                    FRAMES_SKIPPED.fetch_add(frame.seq - prev - 1, Ordering::Relaxed);
                }
            }
            last_seq = Some(frame.seq);
            FRAMES_SERVED.fetch_add(1, Ordering::Relaxed);
            stream::iter(multipart_chunks(frame).map(Ok::<_, Infallible>))
        })
        .flatten();

    Response::builder()
        .status(StatusCode::OK)
        .header(
            header::CONTENT_TYPE,
            format!("multipart/x-mixed-replace; boundary={BOUNDARY}"),
        )
        .header(header::CACHE_CONTROL, "no-cache, private")
        .body(Body::from_stream(body))
        .expect("static MJPEG response headers are valid")
}

pub async fn serve() {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
    let app = Router::new().route("/stream", get(video_feed)).layer(cors);

    let listener = match tokio::net::TcpListener::bind(STREAM_ADDR).await {
        Ok(listener) => listener,
        Err(e) => {
            eprintln!("Could not bind video stream server on {STREAM_ADDR}: {e}");
            return;
        }
    };
    println!("Local video stream server started at http://{STREAM_ADDR}/stream");

    // Sin Nagle: cada frame sale en cuanto está listo.
    if let Err(e) = axum::serve(listener, app).tcp_nodelay(true).await {
        eprintln!("Video stream server stopped: {e}");
    }
}
