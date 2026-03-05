mod camera;

#[tauri::command]
fn get_video_devices() -> Result<Vec<camera::DeviceInfo>, String> {
    Ok(camera::get_devices())
}

#[tauri::command]
fn get_camera_formats(camera_id: u32) -> Result<Vec<camera::FormatInfo>, String> {
    camera::get_camera_formats(camera_id)
}

#[tauri::command]
fn start_video_stream(camera_id: u32, width: u32, height: u32, fps: u32) -> Result<(), String> {
    camera::start_camera(camera_id, width, height, fps)
}

#[tauri::command]
fn stop_video_stream() -> Result<(), String> {
    camera::stop_camera();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            camera::start_server();
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
