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

fn start_backend<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<Child, Box<dyn std::error::Error>> {
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
        // Production: use Tauri's resource resolver
        let resource_resolver = app.path();
        let resource_dir = resource_resolver.resource_dir()
            .map_err(|e| format!("Failed to get resource directory: {}", e))?;

        log::info!("Resource directory: {:?}", resource_dir);

        // In production, backend files are copied to resource dir root
        // Try multiple possible locations
        let possible_paths = vec![
            resource_dir.clone(),                    // Root of resource dir
            resource_dir.join("backend"),            // backend subdirectory
            resource_dir.join("../backend"),         // Parent directory
        ];

        log::info!("Trying paths: {:?}", possible_paths);

        // Find the first existing path with main.py
        possible_paths.into_iter()
            .find(|p| p.join("main.py").exists())
            .ok_or("Backend directory not found in any expected location")?
    };

    log::info!("Backend path: {:?}", backend_path);
    log::info!("Backend exists: {}", backend_path.exists());

    // Verify backend directory exists
    if !backend_path.exists() {
        return Err(format!("Backend directory not found at: {:?}", backend_path).into());
    }

    // Verify main.py exists
    let main_py = backend_path.join("main.py");
    if !main_py.exists() {
        return Err(format!("main.py not found at: {:?}", main_py).into());
    }
    log::info!("Found main.py at: {:?}", main_py);

    // Start the backend process
    #[cfg(target_os = "windows")]
    let child = {
        // Convert path to normal Windows format (remove \\?\ prefix if present)
        let backend_path_str = backend_path.to_str()
            .ok_or("Backend path contains invalid UTF-8")?
            .strip_prefix(r"\\?\").unwrap_or(backend_path.to_str().unwrap());

        log::info!("Normalized backend path for PowerShell: {}", backend_path_str);

        // Windows: use PowerShell for better command handling
        let script = format!(
            "cd '{}'; \
            Write-Output 'Setting up Python environment...'; \
            if (!(Test-Path 'venv')) {{ \
                Write-Output 'Creating venv...'; \
                python -m venv venv; \
            }}; \
            Write-Output 'Activating venv...'; \
            .\\venv\\Scripts\\Activate.ps1; \
            Write-Output 'Installing dependencies...'; \
            pip install -q -r requirements.txt; \
            Write-Output 'Starting uvicorn...'; \
            uvicorn main:app --host 127.0.0.1 --port 3000",
            backend_path_str
        );

        log::info!("Executing PowerShell script: {}", script);

        // Use stdout/stderr redirection for better debugging
        use std::process::Stdio;

        let mut cmd = Command::new("powershell");
        cmd.args(["-NoProfile", "-Command", &script])
            .current_dir(&backend_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Only hide window in release mode if explicitly needed
        #[cfg(not(debug_assertions))]
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

        cmd.spawn()?
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

    log::info!("Backend process spawned, waiting for server to start...");

    // Wait for the server to start with retries
    let max_retries = 20; // 20 seconds max
    let mut retries = 0;

    while retries < max_retries {
        std::thread::sleep(std::time::Duration::from_secs(1));

        if !is_port_available(3000) {
            log::info!("Backend is now responding on port 3000");
            return Ok(child);
        }

        retries += 1;
        log::info!("Waiting for backend... ({}/{})", retries, max_retries);
    }

    log::error!("Backend failed to start within {} seconds", max_retries);
    Err("Backend failed to start - port 3000 not responding".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      // Enable logs in both dev and production
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
      )?;

      // Start the backend process
      match start_backend(&app.handle()) {
        Ok(child) => {
          app.manage(BackendProcess(Mutex::new(Some(child))));
          log::info!("Backend process started and managed");
        }
        Err(e) => {
          log::error!("Failed to start backend: {}", e);
          log::error!(
            "Please check:\n\
            - Python is installed and in PATH\n\
            - Port 3000 is available\n\
            - Backend files are properly bundled\n\n\
            Logs are saved to the application data directory."
          );
          // The app will continue to run, but API calls will fail
          // Users will see "Failed to fetch" errors in the UI
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
