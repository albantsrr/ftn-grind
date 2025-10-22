use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;
use std::path::PathBuf;
use port_scanner::scan_port_addr;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

struct BackendProcess(Mutex<Option<Child>>);

fn is_port_available(port: u16) -> bool {
    !scan_port_addr(format!("127.0.0.1:{}", port))
}

/// Get the path to the embedded Python executable
fn get_embedded_python_path(backend_path: &PathBuf) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let python_embedded_dir = backend_path.join("python-embedded");

    #[cfg(target_os = "windows")]
    let python_exe = python_embedded_dir.join("windows/python/python.exe");

    #[cfg(target_os = "linux")]
    let python_exe = python_embedded_dir.join("linux/python/bin/python3");

    #[cfg(target_os = "macos")]
    let python_exe = python_embedded_dir.join("macos/python/bin/python3");

    if !python_exe.exists() {
        return Err(format!(
            "Embedded Python not found at: {:?}. Please ensure the application was built correctly.",
            python_exe
        ).into());
    }

    log::info!("Using embedded Python at: {:?}", python_exe);
    Ok(python_exe)
}

fn start_backend<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> Result<Child, Box<dyn std::error::Error>> {
    // Check if backend is already running
    if !is_port_available(3000) {
        log::info!("Backend already running on port 3000");
        return Err("Backend already running".into());
    }

    log::info!("Starting FastAPI backend with embedded Python...");

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

        // In production, backend files are in resource_dir/backend/
        // Try multiple possible locations for compatibility
        let possible_paths = vec![
            resource_dir.join("backend"),            // backend subdirectory (primary)
            resource_dir.clone(),                    // Root of resource dir (fallback)
            resource_dir.join("../backend"),         // Parent directory (fallback)
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

    // Get embedded Python path
    let python_exe = get_embedded_python_path(&backend_path)?;
    let python_exe_str = python_exe.to_str()
        .ok_or("Python path contains invalid UTF-8")?;

    // Start the backend process
    #[cfg(target_os = "windows")]
    let child = {
        // Convert path to normal Windows format (remove \\?\ prefix if present)
        let backend_path_str = backend_path.to_str()
            .ok_or("Backend path contains invalid UTF-8")?
            .strip_prefix(r"\\?\").unwrap_or(backend_path.to_str().unwrap());

        log::info!("Normalized backend path for PowerShell: {}", backend_path_str);

        // Create log file path for backend startup
        let log_file = format!("{}\\backend_startup.log", backend_path_str);

        // Windows: PowerShell script using embedded Python
        // No venv needed - using embedded Python directly
        let script = format!(
            "$ErrorActionPreference = 'Continue'; \
            $LogFile = '{}'; \
            function Log {{ param($msg); $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; \"[$timestamp] $msg\" | Tee-Object -FilePath $LogFile -Append | Write-Output }}; \
            try {{ \
                Log 'Starting backend with embedded Python...'; \
                cd '{}'; \
                Log \"Working directory: $(Get-Location)\"; \
                Log 'Embedded Python: {}'; \
                $pythonVersion = & '{}' --version 2>&1; \
                Log \"Python version: $pythonVersion\"; \
                Log 'Installing dependencies...'; \
                & '{}' -m pip install --upgrade pip --quiet 2>&1 | Tee-Object -FilePath $LogFile -Append; \
                & '{}' -m pip install -r requirements.txt --quiet 2>&1 | Tee-Object -FilePath $LogFile -Append; \
                if ($LASTEXITCODE -ne 0) {{ Log 'ERROR: Failed to install dependencies'; exit 1 }}; \
                Log 'Dependencies installed successfully'; \
                Log 'Starting uvicorn server on port 3000...'; \
                & '{}' -m uvicorn main:app --host 127.0.0.1 --port 3000 2>&1 | Tee-Object -FilePath $LogFile -Append; \
            }} catch {{ \
                Log \"FATAL ERROR: $_\"; \
                exit 1 \
            }}",
            log_file,
            backend_path_str,
            python_exe_str,
            python_exe_str,
            python_exe_str,
            python_exe_str,
            python_exe_str
        );

        log::info!("Executing PowerShell script with logging to: {}", log_file);

        // Use stdout/stderr redirection for better debugging
        use std::process::Stdio;

        let mut cmd = Command::new("powershell");
        cmd.args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &script])
            .current_dir(&backend_path)
            .stdout(Stdio::inherit())  // Inherit to see output in console during dev
            .stderr(Stdio::inherit());

        // Only hide window in release mode
        #[cfg(not(debug_assertions))]
        {
            cmd.stdout(Stdio::null())
               .stderr(Stdio::null())
               .creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        cmd.spawn()?
    };

    #[cfg(not(target_os = "windows"))]
    let child = {
        // Linux/macOS: Use embedded Python directly, no venv
        let cmd_str = format!(
            "cd {} && \
            {} -m pip install --upgrade pip --quiet && \
            {} -m pip install -r requirements.txt --quiet && \
            {} -m uvicorn main:app --host 127.0.0.1 --port 3000",
            backend_path.to_str().unwrap(),
            python_exe_str,
            python_exe_str,
            python_exe_str
        );

        log::info!("Executing: {}", cmd_str);

        Command::new("sh")
            .arg("-c")
            .arg(&cmd_str)
            .current_dir(&backend_path)
            .spawn()?
    };

    log::info!("Backend process started successfully");
    Ok(child)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            log::info!("Setting up FortiFlow application");

            let app_handle = app.handle().clone();

            // Try to start the backend
            match start_backend(&app_handle) {
                Ok(child) => {
                    log::info!("Backend started successfully");
                    let state = app.state::<BackendProcess>();
                    *state.0.lock().unwrap() = Some(child);
                }
                Err(e) => {
                    log::error!("Failed to start backend: {}", e);
                    log::error!("The application may not function correctly.");
                    log::error!("Please check the backend_startup.log file for more details.");
                }
            }

            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                log::info!("Window close requested - cleaning up backend");

                let state = _window.state::<BackendProcess>();

                if let Ok(mut backend) = state.0.lock() {
                    if let Some(mut child) = backend.take() {
                        log::info!("Killing backend process");
                        let _ = child.kill();
                    }
                };
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
