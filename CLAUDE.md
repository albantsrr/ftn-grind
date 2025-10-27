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
- `auth.py`: JWT authentication with bcrypt password hashing
- `routers/routines.py`: CRUD endpoints for routines (protected routes)
- `routers/timer.py`: Timer execution with asyncio
- `routers/auth.py`: Login, register, and user management
- `routers/community.py`: Public routine listing with search/filters
- `routers/tags.py`: Tag management and routine tagging
- `routers/ratings.py`: Routine rating system (1-5 stars)

**Database Schema (French field names):**
```
users:
  - id, email, username, hashed_password, is_active, created_at

routines:
  - id, user_id (FK), nom, date, sound_type, volume, image_url
  - is_public (boolean), author_name (for public routines)
  - average_rating (float, 0-5), total_ratings (int)

routine_steps:
  - id, routine_id (FK), nom, code_map, duree (seconds), tips, order
  - Cascade delete: deleting a routine deletes all its steps

tags:
  - id, nom, color (hex color)

routine_tags (many-to-many):
  - routine_id (FK), tag_id (FK)

routine_ratings:
  - id, routine_id (FK), user_id (FK), rating (1-5), created_at
  - Unique constraint: one rating per user per routine
```

**Key API Endpoints:**

*Authentication:*
- `POST /api/auth/login`: Login with username/password (returns JWT)
- `POST /api/auth/register`: Register new user
- `GET /api/auth/me`: Get current user info

*Routines (Protected):*
- `GET /api/routines/`: List user's routines
- `POST /api/routines/`: Create routine with steps
- `PUT /api/routines/{id}`: Update routine and/or steps
- `DELETE /api/routines/{id}`: Delete routine (cascades to steps)

*Community:*
- `GET /api/community/routines`: List public routines with search/filters (search, author, tags, sort_by)
- `POST /api/community/routines/{id}/share`: Toggle routine public/private status

*Tags:*
- `GET /api/tags/`: List all available tags
- `POST /api/tags/routines/{id}/tags`: Add tag to routine
- `DELETE /api/tags/routines/{id}/tags/{tag_id}`: Remove tag from routine

*Ratings:*
- `POST /api/ratings/routines/{id}/rate`: Rate a routine (1-5 stars)
- `GET /api/ratings/routines/{id}/rating`: Get rating info (average, total, user's rating)
- `DELETE /api/ratings/routines/{id}/rate`: Delete user's rating

*Timer:*
- `POST /api/timer/start-routine/{id}`: Execute routine with asyncio.sleep() sequencing
- `GET /api/timer/routine-preview/{id}`: Preview routine duration

**Environments:** Dev: `http://localhost:3000` (SQLite) | Prod: `http://72.61.166.22` (PostgreSQL+Docker)
See [DEPLOYMENT.md](backend/DEPLOYMENT.md) for deployment.

### Frontend (React + TypeScript)

Page-based routing structure:

**Pages:**
- `Login.tsx`: Login page (route: `/login`)
- `Register.tsx`: Registration page (route: `/register`)
- `RoutinesList.tsx`: Home page (route: `/`) - user's private routines
- `CreateRoutine.tsx`: Create routine form (route: `/create`)
- `EditRoutine.tsx`: Edit routine form (route: `/edit/:id`)
- `PlayRoutine.tsx`: Timer execution player (route: `/play/:id`)
- `Community.tsx`: Public routines with search/filters (route: `/community`)

**Key Components:**
- `RoutineCard.tsx`: Routine display card with actions
- `TagBadge.tsx`: Colored tag display
- `TagSelector.tsx`: Multi-select tag picker
- `RatingStars.tsx`: Star rating display/input (1-5 stars)
- `SearchBar.tsx`: Search input with debounce (400ms)
- `FilterPanel.tsx`: Collapsible tag filter panel
- `SkeletonCard.tsx`: Loading placeholder card
- `Tooltip.tsx`: Hover tooltip component
- `Sidebar.tsx`: Navigation sidebar
- `ThemeToggle.tsx`: Dark/light mode switcher

**Key Files:**
- `services/api.ts`: API client for backend communication
- `types/index.ts`: TypeScript interfaces (Routine, RoutineStep, Tag, Rating, User, Auth)
- `contexts/AuthContext.tsx`: JWT authentication context
- `App.tsx`: React Router configuration with protected routes

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

**Authentication:** JWT tokens stored in localStorage (key: `fortiflow_token`). All API calls except login/register require `Authorization: Bearer <token>` header.

**Field Naming:** Database uses French names (nom, duree, code_map, tips) - maintain consistency when adding fields

**Testing:** pytest + pytest-asyncio. Tests use FastAPI TestClient with httpx for async.

**TypeScript:** `verbatimModuleSyntax` enabled - use `import type` for React types (ReactNode, FormEvent, etc).

**Timer Flow:** Backend uses asyncio.sleep() sequencing; frontend has client-side display (pause/resume).

**CORS:** `allow_origins=["*"]` - safe for localhost-only API. Required for Vite/Tauri protocols.

**Step Ordering:** `order` field (int) determines execution sequence, set automatically on creation.

**Community Features:**
- **Sharing:** Users can toggle routines public/private. Public routines appear in Community page.
- **Tags:** Pre-seeded with 8 default tags (Aim, Build, Edit, Movement, etc.). Many-to-many relationship.
- **Ratings:** Users can rate public routines 1-5 stars. One rating per user per routine. Average is recalculated on each rating change.
- **Search & Filters:** Community page supports searching by name, filtering by tags, filtering by author, and sorting (date/name/rating).
- **Pagination:** Community shows 12 routines per page with navigation controls.
- **UX Polish:** Skeleton loaders, fade-in animations, tooltips, improved error messages.

## Release & Distribution

**Quick:** `./scripts/prepare-release.sh <version>` → bumps versions + creates tag

**Manual:** Update `tauri.conf.json`, `Cargo.toml`, `package.json`, `docs/index.html` → create `v*.*.*` tag → push

**CI/CD:** `release.yml` builds Windows MSI/EXE on tag push. `pages.yml` deploys download page.

**Formats:** Windows (MSI+EXE) only (Linux/macOS builds disabled)

See [QUICK_RELEASE.md](docs/release/QUICK_RELEASE.md) or [RELEASE.md](docs/release/RELEASE.md).

## Project Status

**Current Features:**
- ✅ User authentication (JWT-based login/register)
- ✅ Private routine management (CRUD with steps)
- ✅ Timer execution with sound alerts
- ✅ Community system (share routines publicly)
- ✅ Tag system (categorize routines)
- ✅ Rating system (1-5 stars)
- ✅ Advanced search & filters (by name, tags, author)
- ✅ Pagination & UX polish (skeleton loaders, animations, tooltips)
- ✅ Desktop app (Tauri v2) with automated releases

**Planned:** V1 (user licensing) → V2 (cloud sync, PostgreSQL) → V3 (React Native mobile app)

## Testing

See [TEST_COMMUNITY_FEATURES.md](TEST_COMMUNITY_FEATURES.md) for comprehensive test plan covering all community features (sharing, tags, ratings, search/filters, UX improvements).
