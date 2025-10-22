# Embedded Python for FortiFlow

This directory will contain the embedded Python runtime that ships with FortiFlow.

## What goes here

For each platform, we bundle a standalone Python 3.12 distribution:

### Windows
- Source: https://github.com/indygreg/python-build-standalone/releases
- File: `cpython-3.12.X+YYYYMMDD-x86_64-pc-windows-msvc-shared-install_only.tar.gz`
- Extract to: `backend/python-embedded/windows/`

### Linux
- Source: https://github.com/indygreg/python-build-standalone/releases
- File: `cpython-3.12.X+YYYYMMDD-x86_64-unknown-linux-gnu-install_only.tar.gz`
- Extract to: `backend/python-embedded/linux/`

### macOS
- Source: https://github.com/indygreg/python-build-standalone/releases
- File: `cpython-3.12.X+YYYYMMDD-x86_64-apple-darwin-install_only.tar.gz` (Intel)
- File: `cpython-3.12.X+YYYYMMDD-aarch64-apple-darwin-install_only.tar.gz` (Apple Silicon)
- Extract to: `backend/python-embedded/macos/`

## Setup Instructions

### Automated Download (Recommended)

Run the download script:
```bash
cd backend
./download-python.sh
```

### Manual Download

1. Go to: https://github.com/indygreg/python-build-standalone/releases/latest
2. Download the appropriate file for your platform
3. Extract to the corresponding directory
4. The final structure should be:
   ```
   backend/python-embedded/
   ├── windows/
   │   └── python/
   │       ├── python.exe
   │       ├── Lib/
   │       └── ...
   ├── linux/
   │   └── python/
   │       ├── bin/python3
   │       └── ...
   └── macos/
       └── python/
           ├── bin/python3
           └── ...
   ```

## Size Information

Each platform distribution is approximately:
- Windows: ~40 MB compressed, ~150 MB extracted
- Linux: ~35 MB compressed, ~140 MB extracted
- macOS: ~35 MB compressed, ~140 MB extracted

## .gitignore

The actual Python binaries are NOT committed to git due to their size.
Only this README and the download script are version controlled.

## CI/CD Integration

The GitHub Actions workflow automatically downloads the embedded Python
during the build process, so users get a complete package with Python included.
