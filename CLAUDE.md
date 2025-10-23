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
python --version  # Must be 3.10-3.12 (NOT 3.13)

# Start server (recommended)
./run_backend.sh

# Manual: python3 -m venv venv && source venv/bin/activate
# pip install -r requirements.txt && uvicorn main:app --reload --port 3000

# Tests
pytest                    # All tests
pytest tests/test_*.py   # Specific file
pytest -v -s             # Verbose with output
pytest --cov             # With coverage
```

API at `http://localhost:3000` - docs at `/docs`, health at `/health`

### Frontend
```bash
cd frontend
npm install          # First time only
npm run dev          # Dev server at http://localhost:5173
npm run build        # Production build
npm run lint         # Lint code
npm run preview      # Preview build
```

### Desktop Application (Tauri)
```bash
cd frontend
npm install          # First time (+ install Rust via rustup)
npm run tauri:dev    # Dev mode (auto-starts backend)
npm run tauri:build  # Build executable → src-tauri/target/release/bundle/
```

**Critical:** Tauri auto-starts backend on port 3000. Do NOT run `./run_backend.sh` separately.
See [TAURI_SETUP.md](docs/setup/TAURI_SETUP.md) for setup details.

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

**Environments:** Dev: `http://localhost:3000` (SQLite) | Prod: `http://72.61.166.22` (PostgreSQL+Docker)
See [DEPLOYMENT.md](backend/DEPLOYMENT.md) for deployment.

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

**API Config:** `VITE_API_URL` - Dev: `http://localhost:3000` | Prod: `http://72.61.166.22`
See [ENVIRONMENTS.md](frontend/ENVIRONMENTS.md).

### Tauri Desktop Integration

**Critical Architecture Detail:** Tauri automatically manages the backend process lifecycle.

**Backend Auto-Start ([lib.rs](frontend/src-tauri/src/lib.rs)):**
1. Checks port 3000 availability
2. Locates backend: Dev (`../../backend` + system Python) | Prod (bundled + embedded Python 3.12.7)
3. Creates venv, installs deps, starts uvicorn on localhost:3000
4. Kills backend on app close

**Important:** `npm run tauri:dev` auto-starts backend - do NOT run `./run_backend.sh` manually.

**Config:** `tauri.conf.json` (window/bundle), `Cargo.toml` (deps), `capabilities/default.json` (shell perms)

## Key Development Notes

**Field Naming:** Database uses French names (nom, duree, code_map, tips) - maintain consistency when adding fields

**Testing:** pytest + pytest-asyncio. Tests use FastAPI TestClient with httpx for async.

**TypeScript:** `verbatimModuleSyntax` enabled - use `import type` for React types (ReactNode, FormEvent, etc).

**Timer Flow:** Backend uses asyncio.sleep() sequencing; frontend has client-side display (pause/resume).

**CORS:** `allow_origins=["*"]` - safe for localhost-only API. Required for Vite/Tauri protocols.

**Step Ordering:** `order` field (int) determines execution sequence, set automatically on creation.

## Release & Distribution

**Quick:** `./scripts/prepare-release.sh <version>` → bumps versions + creates tag

**Manual:** Update `tauri.conf.json`, `Cargo.toml`, `package.json`, `docs/index.html` → create `v*.*.*` tag → push

**CI/CD:** `release.yml` builds Windows MSI/EXE on tag push. `pages.yml` deploys download page.

**Formats:** Windows (MSI+EXE) only (Linux/macOS builds disabled)

See [QUICK_RELEASE.md](docs/release/QUICK_RELEASE.md) or [RELEASE.md](docs/release/RELEASE.md).

## Project Status

**Current (MVP):** Local desktop app with routine CRUD, timer execution, and automated releases
**Planned:** V1 (user licensing) → V2 (cloud sync, PostgreSQL, routine sharing) → V3 (React Native mobile app)
