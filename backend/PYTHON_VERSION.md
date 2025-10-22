# Python Version Compatibility

## Required Python Version

FortiFlow backend requires **Python 3.10, 3.11, or 3.12**.

## ⚠️ Known Issues

### Python 3.13 (Alpha/Beta/RC versions)

**DO NOT USE Python 3.13 alpha, beta, or release candidate versions.**

If you see errors like:
```
TypeError: cannot convert 'NoneType' object to bytes
error: metadata-generation-failed
Encountered error while generating package metadata for pydantic-core
```

This means you have Python 3.13.0a5 or another pre-release version installed.

### Solution

1. **Uninstall Python 3.13** (or make sure it's not in your PATH)
2. **Install Python 3.12** from [python.org](https://www.python.org/downloads/)
3. **Verify your Python version**:
   ```bash
   python --version
   # Should show: Python 3.10.x, 3.11.x, or 3.12.x
   ```

### Windows Users

On Windows, if you have multiple Python versions:
1. Check which Python is being used: `python --version`
2. If wrong version, update your PATH environment variable
3. Or use `py -3.12` instead of `python` to specify version

### Recommended Setup

```bash
# Check Python version first
python --version

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/macOS)
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

## Troubleshooting

If installation fails:
1. Delete the `venv` folder
2. Verify Python version is 3.10-3.12
3. Create a fresh virtual environment
4. Try installation again

For Tauri desktop app users: The app will create its own virtual environment at `%LOCALAPPDATA%\FortiFlow\backend\venv` on Windows. If you encounter issues, delete this folder and restart the app.
