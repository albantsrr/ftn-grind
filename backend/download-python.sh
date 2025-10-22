#!/bin/bash
# Script to download embedded Python for FortiFlow
# This downloads standalone Python builds from python-build-standalone project

set -e

PYTHON_VERSION="3.12.7"
BUILD_DATE="20241016"
BASE_URL="https://github.com/indygreg/python-build-standalone/releases/download"
RELEASE_TAG="${BUILD_DATE}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EMBEDDED_DIR="${SCRIPT_DIR}/python-embedded"

echo "📦 FortiFlow - Embedded Python Downloader"
echo "=========================================="
echo "Python version: ${PYTHON_VERSION}"
echo "Build date: ${BUILD_DATE}"
echo ""

# Create directories
mkdir -p "${EMBEDDED_DIR}"/{windows,linux,macos}

# Function to download and extract
download_python() {
    local platform=$1
    local filename=$2
    local target_dir=$3

    echo "🔽 Downloading Python for ${platform}..."

    local url="${BASE_URL}/${RELEASE_TAG}/${filename}"
    local download_path="${EMBEDDED_DIR}/${filename}"

    if [ -f "${download_path}" ]; then
        echo "   ✓ Archive already downloaded"
    else
        echo "   URL: ${url}"
        curl -L -o "${download_path}" "${url}"
        echo "   ✓ Downloaded"
    fi

    echo "📂 Extracting to ${target_dir}..."
    rm -rf "${target_dir}"
    mkdir -p "${target_dir}"
    tar -xzf "${download_path}" -C "${target_dir}"
    echo "   ✓ Extracted"

    # Clean up archive
    rm -f "${download_path}"
    echo "   ✓ Cleaned up archive"
    echo ""
}

# Detect current platform
PLATFORM="$(uname -s)"
case "${PLATFORM}" in
    Linux*)
        echo "🐧 Detected Linux - downloading Linux build only"
        download_python "Linux" \
            "cpython-${PYTHON_VERSION}+${BUILD_DATE}-x86_64-unknown-linux-gnu-install_only.tar.gz" \
            "${EMBEDDED_DIR}/linux"
        ;;
    Darwin*)
        echo "🍎 Detected macOS - downloading macOS builds"
        # Detect architecture
        ARCH="$(uname -m)"
        if [ "${ARCH}" = "arm64" ]; then
            echo "   (Apple Silicon detected)"
            download_python "macOS Apple Silicon" \
                "cpython-${PYTHON_VERSION}+${BUILD_DATE}-aarch64-apple-darwin-install_only.tar.gz" \
                "${EMBEDDED_DIR}/macos"
        else
            echo "   (Intel detected)"
            download_python "macOS Intel" \
                "cpython-${PYTHON_VERSION}+${BUILD_DATE}-x86_64-apple-darwin-install_only.tar.gz" \
                "${EMBEDDED_DIR}/macos"
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        echo "🪟 Detected Windows - downloading Windows build only"
        download_python "Windows" \
            "cpython-${PYTHON_VERSION}+${BUILD_DATE}-x86_64-pc-windows-msvc-shared-install_only.tar.gz" \
            "${EMBEDDED_DIR}/windows"
        ;;
    *)
        echo "❌ Unknown platform: ${PLATFORM}"
        echo "Please download manually from:"
        echo "https://github.com/indygreg/python-build-standalone/releases"
        exit 1
        ;;
esac

echo "✅ Embedded Python downloaded successfully!"
echo ""
echo "📊 Directory sizes:"
du -sh "${EMBEDDED_DIR}"/*/ 2>/dev/null || true
echo ""
echo "🎯 Next steps:"
echo "   1. Build the Tauri app: npm run tauri:build"
echo "   2. The embedded Python will be included in the installer"
