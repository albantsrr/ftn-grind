# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FortiFlow is a desktop training application for Fortnite players. Users create training routines with multiple timed steps (exercises on specific Fortnite maps), then execute them with an integrated timer, sound alerts, and instructions.

## Technical Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + React Router
- **Backend**: FastAPI + SQLAlchemy ORM (Python 3.10-3.12)
- **Database**: SQLite (local file: `backend/fortiflow.db`)
- **Desktop**: Tauri v2 (Rust) with embedded Python 3.12.7 for production builds
- **Testing**: pytest with async support

**Python Version Requirements:**
- **Development**: Python 3.10, 3.11, or 3.12 only (NOT 3.13 - dependency incompatibility)
- **Production**: Embedded Python 3.12.7 bundled in Tauri executable
- See [backend/PYTHON_VERSION.md](backend/PYTHON_VERSION.md) for troubleshooting

## Development Commands

### Backend
```bash
cd backend

# Check Python version first (must be 3.10-3.12, NOT 3.13)
python --version

# Using the provided launcher script (recommended)
./run_backend.sh

# Manual setup
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 3000

# Run all tests
pytest

# Run specific test file
pytest tests/test_routines.py
pytest tests/test_timer.py

# Run with verbose output and show print statements
pytest -v -s

# Run with coverage report
pytest --cov
```

Backend API runs at: `http://localhost:3000`
- API docs: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

Frontend runs at: `http://localhost:5173`

### Desktop Application (Tauri)
```bash
cd frontend

# Prerequisites: Install Rust first (see TAURI_SETUP.md)
# curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install dependencies (first time)
npm install

# Run desktop app in development mode
# This automatically starts the backend and opens a native window
npm run tauri:dev

# Build desktop executable for distribution
npm run tauri:build
```

**Important:** When running in Tauri mode, the backend is started automatically by the Rust code. You do NOT need to run `./run_backend.sh` separately.

Desktop app executable location after build: `frontend/src-tauri/target/release/bundle/`

For detailed Tauri setup instructions, see [docs/setup/TAURI_SETUP.md](docs/setup/TAURI_SETUP.md)

## Architecture

### Backend (FastAPI + SQLAlchemy)

The backend uses a modular router pattern with SQLAlchemy ORM:

**Structure:**
- `main.py`: App initialization, CORS (`allow_origins=["*"]` for localhost-only API), router registration
- `database.py`: SQLite connection and session management
- `models.py`: Combined SQLAlchemy ORM models and Pydantic validation models
- `routers/routines.py`: CRUD endpoints for routines
- `routers/timer.py`: Timer execution with asyncio

**Database Schema (French field names):**
```
routines:
  - id, nom, date, sound_type (beep/bell/chime/notification), volume (0-100), image_url

routine_steps:
  - id, routine_id (FK), nom, code_map, duree (seconds), tips, order
  - Cascade delete: deleting a routine deletes all its steps
```

**Key API Endpoints:**
- `GET /api/routines/`: List all routines
- `POST /api/routines/`: Create routine with steps
- `PUT /api/routines/{id}`: Update routine and/or steps
- `DELETE /api/routines/{id}`: Delete routine (cascades to steps)
- `POST /api/timer/start-routine/{id}`: Execute routine with asyncio.sleep() sequencing
- `GET /api/timer/routine-preview/{id}`: Preview routine duration

**Backend environments:**
- **Development (local):** `http://localhost:3000` - SQLite database
- **Production (VPS):** `http://72.61.166.22` - PostgreSQL + Docker Compose
- API docs: `/docs`
- Health check: `/health`
- See [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md) for deployment guide

### Frontend (React + TypeScript)

Page-based routing structure:

**Pages:**
- `RoutinesList.tsx`: Home page (route: `/`)
- `CreateRoutine.tsx`: Create routine form (route: `/create`)
- `EditRoutine.tsx`: Edit routine form (route: `/edit/:id`)
- `PlayRoutine.tsx`: Timer execution player (route: `/play/:id`)

**Key Files:**
- `services/api.ts`: API client for backend communication
- `types/index.ts`: TypeScript interfaces (Routine, RoutineStep, RoutineCreate)
- `App.tsx`: React Router configuration

**API Configuration:** Backend expected at `http://localhost:3000` (via `VITE_API_URL` or default)

### Tauri Desktop Integration

**Critical Architecture Detail:** Tauri automatically manages the backend process lifecycle.

**Backend Auto-Start (frontend/src-tauri/src/lib.rs):**
1. Checks if port 3000 is available
2. Locates backend directory:
   - **Development**: `../../backend` from `frontend/src-tauri/` (uses system Python)
   - **Production**: Bundled in resource directory with embedded Python 3.12.7
3. Uses embedded Python from `backend/python-embedded/{os}/python/` (Windows/Linux/macOS)
4. Creates venv if needed and installs dependencies
5. Starts uvicorn server on localhost:3000
6. Kills backend process when app closes

**Important:** When running `npm run tauri:dev`, do NOT manually start the backend - Tauri does it automatically.

**Tauri Configuration:**
- `frontend/src-tauri/tauri.conf.json`: Window settings, bundle config, backend resources
- `frontend/src-tauri/Cargo.toml`: Rust dependencies (tauri-plugin-shell, port_scanner)
- `frontend/src-tauri/capabilities/default.json`: Shell execution permissions

## Key Development Notes

**Field Naming:** Database uses French names (nom, duree, code_map, tips) - maintain consistency when adding fields

**Testing:** Backend uses pytest with async support (`pytest-asyncio`). Tests in `backend/tests/` use FastAPI's TestClient with httpx for async requests.

**Timer Flow:** Backend timer uses asyncio.sleep() for step sequencing, but frontend implements client-side timer display for responsiveness (pause/resume handled client-side).

**CORS:** All origins allowed (`allow_origins=["*"]`) because API is localhost-only with no sensitive data. Required for Vite dev server, Tauri custom protocols, and different local ports.

**Step Ordering:** Steps have an `order` field (integer) that determines execution sequence. Order is set automatically when creating steps in sequence.

## Release & Distribution

**Quick Release:** Run `./scripts/prepare-release.sh <version>` to bump versions and create git tag

**Manual Process:**
1. Update versions in: `tauri.conf.json`, `Cargo.toml`, `frontend/package.json`, `docs/index.html`
2. Create git tag matching `v*.*.*` pattern
3. Push tag to trigger GitHub Actions release workflow

**Automated Build:**
- `.github/workflows/release.yml`: Builds Windows MSI, Linux AppImage/DEB, macOS DMG
- `.github/workflows/pages.yml`: Deploys download page to GitHub Pages
- Draft releases created automatically in GitHub Releases

**Distribution Formats:**
- Windows: MSI installer (WiX Toolset required for local builds)
- Linux: AppImage (portable) + DEB package
- macOS: DMG (Intel + Apple Silicon)

See [docs/release/QUICK_RELEASE.md](docs/release/QUICK_RELEASE.md) or [docs/release/RELEASE.md](docs/release/RELEASE.md) for details.

## Project Status

**Current (MVP):** Local desktop app with routine CRUD, timer execution, and automated releases
**Planned:** V1 (user licensing) → V2 (cloud sync, PostgreSQL, routine sharing) → V3 (React Native mobile app)
