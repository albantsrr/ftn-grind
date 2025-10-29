// FortiFlow Tauri Application
// Connects to cloud backend API at http://72.61.166.22

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            log::info!("FortiFlow application started");
            log::info!("Connecting to cloud backend at: http://72.61.166.22");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
