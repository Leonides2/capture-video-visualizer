mod camera;
mod stream_server;

use camera::{DeviceInfo, FormatInfo, FormatRequest};
use tauri::AppHandle;

/// Ejecuta el acceso a la cámara (bloqueante) fuera del hilo principal para no congelar la UI.
async fn run_blocking<T, F>(task: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String> + Send + 'static,
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|e| format!("Background task failed: {e}"))?
}

#[tauri::command]
async fn get_video_devices() -> Result<Vec<DeviceInfo>, String> {
    run_blocking(|| Ok(camera::list_devices())).await
}

#[tauri::command]
async fn get_camera_formats(camera_id: u32) -> Result<Vec<FormatInfo>, String> {
    run_blocking(move || camera::list_formats(camera_id)).await
}

/// Devuelve el formato realmente activo.
#[tauri::command]
async fn start_video_stream(
    app: AppHandle,
    camera_id: u32,
    width: u32,
    height: u32,
    fps: u32,
    codec: Option<String>,
) -> Result<FormatInfo, String> {
    let request = FormatRequest {
        width,
        height,
        fps,
        codec: codec.as_deref().and_then(camera::parse_codec),
    };
    run_blocking(move || camera::start(app, camera_id, request)).await
}

#[tauri::command]
async fn stop_video_stream() -> Result<(), String> {
    run_blocking(|| {
        camera::stop();
        Ok(())
    })
    .await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            tauri::async_runtime::spawn(stream_server::serve());
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_video_devices,
            get_camera_formats,
            start_video_stream,
            stop_video_stream
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
