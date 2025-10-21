use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;
use port_scanner::scan_port_addr;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

struct BackendProcess(Mutex<Option<Child>>);

fn is_port_available(port: u16) -> bool {
    !scan_port_addr(format!("127.0.0.1:{}", port))
}

fn start_backend() -> Result<Child, Box<dyn std::error::Error>> {
    // Check if backend is already running
    if !is_port_available(3000) {
        log::info!("Backend already running on port 3000");
        return Err("Backend already running".into());
    }

    log::info!("Starting FastAPI backend...");

    // Determine the path to the backend directory
    let backend_path = if cfg!(debug_assertions) {
        // Development: backend is at ../../../backend from src-tauri/src
        std::env::current_dir()?
            .parent()
            .ok_or("Failed to get parent directory")?
            .parent()
            .ok_or("Failed to get parent directory")?
            .join("backend")
    } else {
        // Production: backend is bundled with the app
        // This will need to be adjusted based on your bundling strategy
        std::env::current_exe()?
            .parent()
            .ok_or("Failed to get exe directory")?
            .join("backend")
    };

    log::info!("Backend path: {:?}", backend_path);

    // Start the backend process
    #[cfg(target_os = "windows")]
    let child = {
        // Windows: use PowerShell for better command handling
        let script = format!(
            "cd '{}'; \
            if (!(Test-Path 'venv')) {{ python -m venv venv }}; \
            .\\venv\\Scripts\\Activate.ps1; \
            pip install -q -r requirements.txt; \
            uvicorn main:app --host 127.0.0.1 --port 3000",
            backend_path.display()
        );

        Command::new("powershell")
            .args(["-NoProfile", "-Command", &script])
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn()?
    };

    #[cfg(not(target_os = "windows"))]
    let child = {
        Command::new("sh")
            .arg("-c")
            .arg(format!(
                "cd {} && \
                if [ ! -d venv ]; then python3 -m venv venv; fi && \
                source venv/bin/activate && \
                pip install -q -r requirements.txt && \
                uvicorn main:app --host 127.0.0.1 --port 3000",
                backend_path.display()
            ))
            .spawn()?
    };

    log::info!("Backend started successfully");

    // Wait a bit for the server to start
    std::thread::sleep(std::time::Duration::from_secs(3));

    Ok(child)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Start the backend process
      match start_backend() {
        Ok(child) => {
          app.manage(BackendProcess(Mutex::new(Some(child))));
          log::info!("Backend process started and managed");
        }
        Err(e) => {
          log::warn!("Failed to start backend or backend already running: {}", e);
        }
      }

      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        // Kill the backend process when the window closes
        if let Some(backend) = window.app_handle().try_state::<BackendProcess>() {
          if let Ok(mut process) = backend.0.lock() {
            if let Some(mut child) = process.take() {
              let _ = child.kill();
              log::info!("Backend process terminated");
            }
          }
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
