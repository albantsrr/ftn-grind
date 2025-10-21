# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FortiFlow is an intelligent training software for Fortnite players designed to help them improve methodically. It allows users to create, save, and execute training routines with timers, sound alerts, and custom instructions at each step.

## Technical Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + React Router
- **Backend**: FastAPI (Python 3.12) with SQLAlchemy ORM
- **Database**: SQLite (local file: `backend/fortiflow.db`)
- **Desktop**: Tauri v2 (Rust) for native desktop packaging
- **Testing**: pytest with async support

## Development Commands

### Backend
```bash
cd backend

# Using the provided launcher script (recommended)
./run_backend.sh

# Manual setup
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 3000

# Run tests
pytest
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

For detailed Tauri setup instructions, see [TAURI_SETUP.md](TAURI_SETUP.md)

## Architecture

### Backend Structure

The backend uses FastAPI with SQLAlchemy ORM following a modular router pattern:

- `main.py`: FastAPI app initialization, CORS configuration, and router registration
- `database.py`: SQLite connection and session management
- `models.py`: Contains both SQLAlchemy ORM models and Pydantic validation models
- `routers/routines.py`: CRUD endpoints for routine management
- `routers/timer.py`: Timer execution and preview endpoints
- `tests/`: pytest test suites

**Key API Endpoints:**
- `GET /api/routines/`: List all routines
- `GET /api/routines/{id}`: Get specific routine
- `POST /api/routines/`: Create new routine with steps
- `PUT /api/routines/{id}`: Update routine and/or steps
- `DELETE /api/routines/{id}`: Delete routine (cascade deletes steps)
- `POST /api/timer/start-routine/{id}`: Execute routine with async timing
- `GET /api/timer/routine-preview/{id}`: Preview routine duration and steps

**Database Schema:**
- `routines` table: id, nom (name), date
- `routine_steps` table: id, routine_id (FK), nom, code_map, duree (duration in seconds), tips, order
- Relationship: One routine has many steps with cascade delete

**CORS Configuration:**
The backend allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173` (Vite alternative)
- `http://localhost:1420` (Tauri default)
- `tauri://localhost` (Tauri protocol)

### Frontend Structure

The frontend uses React with TypeScript, following a page-based routing structure:

- `main.tsx`: React app entry point
- `App.tsx`: React Router configuration with route definitions
- `pages/`: Page components for each route
  - `RoutinesList.tsx`: Home page listing all routines
  - `CreateRoutine.tsx`: Form to create new routines
  - `EditRoutine.tsx`: Form to edit existing routines (route: `/edit/:id`)
  - `PlayRoutine.tsx`: Routine execution player (route: `/play/:id`)
- `services/api.ts`: API client for backend communication
- `types/index.ts`: TypeScript interfaces (Routine, RoutineStep, RoutineCreate)
- `components/`: Reusable UI components (currently empty)

**Type Definitions:**
- `RoutineStep`: nom, code_map, duree, tips (optional)
- `Routine`: id, nom, date, steps[]
- `RoutineCreate`: nom, steps[] (without IDs)

**API Configuration:**
The frontend expects the backend at `http://localhost:3000` (configured via `VITE_API_URL` env variable or default)

### Data Flow

1. User creates/edits routine in frontend forms
2. Frontend sends API request to backend via `services/api.ts`
3. Backend validates data with Pydantic models
4. SQLAlchemy ORM persists data to SQLite database
5. Backend returns response with full routine data
6. Frontend updates UI and navigates to appropriate page

**Timer Execution Flow:**
1. User clicks play on a routine
2. Frontend calls `POST /api/timer/start-routine/{id}`
3. Backend fetches routine and steps from database
4. Backend executes steps sequentially with `asyncio.sleep()`
5. Backend logs execution and returns summary
6. Frontend displays timer and controls (pause/resume handled client-side)

### Tauri Desktop Structure

The desktop application uses Tauri v2 with automatic backend management:

- `frontend/src-tauri/`: Tauri Rust project
  - `src/lib.rs`: Main Tauri logic with backend process management
  - `src/main.rs`: Entry point
  - `Cargo.toml`: Rust dependencies (includes `tauri-plugin-shell` and `port_scanner`)
  - `tauri.conf.json`: Tauri configuration (window settings, bundle config)
  - `capabilities/default.json`: Permission configuration for shell execution
  - `icons/`: Application icons for different platforms

**Backend Auto-Start:**
When the Tauri app starts:
1. Checks if port 3000 is available
2. Locates the backend directory (relative path in dev, bundled in production)
3. Creates Python venv if needed
4. Installs dependencies from `requirements.txt`
5. Starts uvicorn server on localhost:3000
6. Manages backend process lifecycle (kills on app close)

**Development vs Production:**
- Dev: Backend path is `../../backend` from `frontend/src-tauri/`
- Production: Backend is bundled in the executable directory

## Key Development Notes

- **Backend Language**: Uses French field names in database (nom, duree) while documentation is mixed French/English
- **Tauri Auto-Backend**: The desktop app automatically starts/stops the FastAPI backend; no manual backend launch needed
- **Rust Required**: Tauri requires Rust toolchain for compilation (see TAURI_SETUP.md)
- **Timer Implementation**: Backend timer uses asyncio for step sequencing, but frontend should implement client-side timer for responsiveness
- **Testing**: Backend has pytest configuration with async mode enabled
- **Field Naming**: Be consistent with existing naming conventions (nom, code_map, duree, tips)
- **Cascading Deletes**: Deleting a routine automatically deletes all associated steps
- **Step Ordering**: Steps have an `order` field (integer) that determines execution sequence

## Current Phase

MVP (local development):
- Working CRUD operations for routines
- Basic timer execution endpoint
- React frontend with routing
- SQLite local storage
- Tauri desktop packaging with auto-backend management
- No authentication or user management yet

## Future Plans

- V1: Stable version with user licensing
- V2: Cloud version with accounts, sync, and routine sharing (FastAPI cloud + PostgreSQL)
- V3: Mobile companion app (React Native)
