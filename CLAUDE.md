# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FortiFlow is an intelligent training software for Fortnite players designed to help them improve methodically. It allows users to create, save, and execute training routines with timers, sound alerts, and custom instructions at each step.

## Technical Stack

- **Frontend**: React + TailwindCSS
- **Backend**: FastAPI (Python)
- **Local Database**: SQLite
- **Audio**: Web Audio API
- **Packaging**: Tauri (for cross-platform desktop executable)
- **CI/CD**: GitHub Actions + Docker

## Architecture

The project follows a three-tier architecture:

1. **Backend (FastAPI)**: Handles business logic, routine management (CRUD operations), timer sequencing, and SQLite persistence via SQLAlchemy
2. **Frontend (React)**: User interface with TailwindCSS styling, including routine creation forms, execution player, and timer display
3. **Tauri Layer**: Packages the web app as a native desktop application with local communication between React and FastAPI

### Key Components

- **Backend API Routes**:
  - `routers/routines.py`: CRUD operations for routines
  - `routers/timer.py`: Timer management and sequencing
  - `/start-routine` endpoint: Initiates routine execution with step-by-step timing

- **Frontend Components**:
  - `RoutineForm.tsx`: Create/edit routines
  - `RoutinePlayer.tsx`: Execute routines with controls (pause/resume/next)
  - `TimerDisplay.tsx`: Display current exercise timer

### Data Model

Routines contain:
- `routine_name`: Name of the training routine
- `steps`: Array of exercises with:
  - `name`: Exercise name
  - `code`: Fortnite map code (format: `1234-5678-9999`)
  - `duration_sec`: Duration in seconds
  - `tips`: Focus points or objectives

## Development Commands

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend runs at: `http://localhost:8000`

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Desktop Application (Tauri)
```bash
npm run tauri dev
```

## Project Phases

**Current Phase: MVP (local)**
- Offline desktop application
- Local SQLite storage
- Basic routine creation and execution

**Future Phases**:
- V1: Stable version with user licensing
- V2: Cloud version with accounts, sync, and routine sharing (FastAPI cloud + PostgreSQL)
- V3: Mobile companion app (React Native)

## Business Model

Freemium approach:
- **Free**: Local offline version
- **Pro**: History, stats, cloud sync
- **Team**: Collaboration, shared routines, CSV export

## Key Development Focus

- The application must work completely **offline**
- Timer precision is critical for training effectiveness
- Sound alerts (beeps) between steps are essential for user experience
- Map codes must be easily copyable for quick access in Fortnite
- UI should be immersive and motivating (modern design)
