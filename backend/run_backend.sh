#!/bin/bash

# FortiFlow Backend Launcher
# This script sets up and runs the FastAPI backend

set -e  # Exit on error

echo "🌀 FortiFlow Backend Launcher"
echo "=============================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations (create tables)
echo "🗄️  Setting up database..."
echo "Tables will be created automatically on first run"

# Start the server
echo "🚀 Starting FortiFlow API..."
echo ""
echo "API will be available at:"
echo "  - Main:        http://localhost:8000"
echo "  - Docs:        http://localhost:8000/docs"
echo "  - ReDoc:       http://localhost:8000/redoc"
echo "  - Health:      http://localhost:8000/health"
echo ""
echo "Press CTRL+C to stop the server"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
