# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FortiFlow is a desktop training application for Fortnite players. Users create training routines with multiple timed steps (exercises on specific Fortnite maps), then execute them with an integrated timer, sound alerts, and instructions.

## Technical Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + React Router
- **Backend**: FastAPI + SQLAlchemy ORM (Python 3.10-3.12)
- **Database**: SQLite (local file: `backend/fortiflow.db`) or PostgreSQL (production)
- **Desktop**: Tauri v2 (Rust) - connects to cloud backend API
- **Testing**: pytest with async support

**⚠️ CRITICAL: Python Version Requirements**
- **MUST use Python 3.10, 3.11, or 3.12** (NOT 3.13 due to dependency incompatibility)
- Check version: `python --version` or `python3 --version`
- If wrong version, install correct version and use `python3.12 -m venv venv` (or 3.10/3.11)
- See [docs/backend/PYTHON_VERSION.md](docs/backend/PYTHON_VERSION.md) for troubleshooting

## Environment Setup

**Required Environment Variables (.env file in backend/):**
```bash
# Security (REQUIRED)
SECRET_KEY=your-secret-key-here  # MUST be set, app will fail if missing

# Email (Optional - console logging if not set)
USE_REAL_EMAIL=false  # Set to 'true' for SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@fortiflow.com
FRONTEND_URL=http://localhost:5173

# Stripe (Required for subscription features)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Database (Optional - defaults to SQLite)
DATABASE_URL=sqlite:///./fortiflow.db  # Dev
# DATABASE_URL=postgresql://user:pass@host/db  # Prod
```

See [backend/.env.example](backend/.env.example) for template.

## Development Commands

### Backend
```bash
cd backend
python --version  # Must be 3.10-3.12 (NOT 3.13)

# Start server (recommended - handles venv setup, deps, and launch)
./run_backend.sh

# Manual setup (if needed):
# python3 -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
# pip install -r requirements.txt
# uvicorn main:app --reload --host 127.0.0.1 --port 3000

# Tests (activate venv first)
pytest                    # All tests
pytest tests/test_*.py   # Specific file
pytest -v -s             # Verbose with output
pytest --cov             # With coverage

# Database migrations (after pulling new features)
python scripts/migrate_add_subscriptions.py  # If subscription schema missing
python scripts/migrate_add_email_verification.py  # If email verification missing
python scripts/migrate_add_avatar.py  # If avatar field missing
```

**API Endpoints:**
- Main API: `http://localhost:3000`
- Interactive docs: `http://localhost:3000/docs` (Swagger UI)
- Alternative docs: `http://localhost:3000/redoc`
- Health check: `http://localhost:3000/health`

**Database:** SQLite file created automatically at `backend/fortiflow.db` on first run

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

**Note:** The desktop application connects to the cloud backend API (NOT a local embedded backend).
See [TAURI_SETUP.md](docs/setup/TAURI_SETUP.md) for setup details.

## Architecture

### Backend (FastAPI + SQLAlchemy)

The backend uses a modular router pattern with SQLAlchemy ORM:

**Structure:**
- `main.py`: App initialization, CORS (`allow_origins=["*"]` for localhost-only API), router registration
- `database.py`: SQLite connection and session management
- `models.py`: Combined SQLAlchemy ORM models and Pydantic validation models
- `auth.py`: JWT authentication with bcrypt password hashing
- `config.py`: Centralized configuration and constants (SECRET_KEY, limits, etc.)
- `routers/routines.py`: CRUD endpoints for routines (protected routes)
- `routers/timer.py`: Timer execution with asyncio
- `routers/auth.py`: Login, register, and user management
- `routers/community.py`: Public routine listing with search/filters
- `routers/tags.py`: Tag management and routine tagging
- `routers/ratings.py`: Routine rating system (1-5 stars)
- `routers/subscriptions.py`: Stripe subscription management (checkout, webhooks, portal)
- `routers/statistics.py`: User statistics and analytics (Premium only, grade system, streaks)
- `routers/leaderboard.py`: Global and friends leaderboard (Premium only, scoring system)

**Database Schema (French field names):**
```
users:
  - id, email, username, hashed_password, full_name, is_active, created_at
  - is_verified (boolean), verification_token (text)
  - reset_token (text), reset_token_expires (datetime)
  - subscription_tier (enum: 'free' | 'premium'), trial_ends_at (datetime)

subscriptions:
  - id, user_id (FK unique), stripe_customer_id, stripe_subscription_id
  - subscription_status (enum: 'free' | 'active' | 'canceled' | 'past_due')
  - current_period_start, current_period_end, cancel_at_period_end
  - created_at, updated_at

routine_sessions:
  - id, user_id (FK), routine_id (FK), started_at, completed_at
  - total_duration (seconds), completed (boolean), created_at
  - Used for statistics and streak tracking

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

**Key API Endpoints:** Auth (login, register, verify, reset password) | Routines (CRUD) | Community (public listing, share) | Tags (categorization) | Ratings (1-5 stars) | Timer (execution) | Subscriptions (Stripe checkout, portal, webhooks) | Statistics (Premium: sessions, charts, grades) | Leaderboard (Premium: global/friends rankings). See `/docs` for interactive API reference.

**Environments:**
- Dev: `http://localhost:3000` (SQLite, local testing)
- Prod: `http://72.61.166.22` (PostgreSQL+Docker on VPS)

**Production Deployment:**
```bash
# Quick deploy to VPS (run from backend/ directory)
./scripts/deploy-backend.sh

# What it does:
# 1. Syncs backend files to VPS via rsync (excludes venv, db, tests, .env)
# 2. Rebuilds and restarts Docker containers (PostgreSQL + FastAPI + Nginx)
# 3. Runs health check on http://72.61.166.22/health
# 4. Shows recent logs from the backend container

# Manual deployment steps (if script fails):
# ssh root@72.61.166.22
# cd /opt/fortiflow/backend
# docker compose down && docker compose up -d --build
# docker compose logs -f backend  # Watch logs
```

**VPS Details:**
- IP: `72.61.166.22` (no domain yet - planned for V2)
- Services: PostgreSQL (port 5432), FastAPI (port 8000), Nginx (port 80)
- Config: `/opt/fortiflow/backend/docker-compose.yml`
- Logs: `docker compose logs backend` (from VPS)

See [docs/backend/DEPLOYMENT.md](docs/backend/DEPLOYMENT.md) for full deployment guide.

### Frontend (React + TypeScript)

Page-based routing structure:

**Pages:**
- `Login.tsx`: Login page (route: `/login`)
- `Register.tsx`: Registration page (route: `/register`)
- `ForgotPassword.tsx`: Password reset request (route: `/forgot-password`)
- `ResetPassword.tsx`: New password form (route: `/reset-password?token=xxx`)
- `VerifyEmail.tsx`: Email verification (route: `/verify-email?token=xxx`)
- `RoutinesList.tsx`: Home page (route: `/`) - user's private routines
- `CreateRoutine.tsx`: Create routine form (route: `/create`)
- `EditRoutine.tsx`: Edit routine form (route: `/edit/:id`)
- `PlayRoutine.tsx`: Timer execution player (route: `/play/:id`)
- `Community.tsx`: Public routines with search/filters (route: `/community`)
- `Settings.tsx`: User profile and settings (route: `/settings`)
- `Billing.tsx`: Subscription management (route: `/billing`) - upgrade, portal, status
- `Statistics.tsx`: User stats and charts (route: `/statistics`) - **Premium only**
- `Leaderboard.tsx`: Global and friends rankings (route: `/leaderboard`) - **Premium only**

**Key Components:**
- `RoutineCard.tsx`: Routine display card with actions
- `TagBadge.tsx`: Colored tag display
- `TagSelector.tsx`: Multi-select tag picker
- `RatingStars.tsx`: Star rating display/input (1-5 stars)
- `SearchBar.tsx`: Search input with debounce (400ms)
- `FilterPanel.tsx`: Collapsible tag filter panel
- `SkeletonCard.tsx`: Loading placeholder card
- `Tooltip.tsx`: Hover tooltip component
- `Sidebar.tsx`: Navigation sidebar with Premium badge
- `ThemeToggle.tsx`: Dark/light mode switcher
- `PaywallModal.tsx`: Premium feature paywall modal
- `PremiumRoute.tsx`: Route wrapper for Premium-only pages

**Key Files:**
- `services/api.ts`: API client for backend communication (includes Stripe, statistics endpoints)
- `types/index.ts`: TypeScript interfaces (Routine, User, Subscription, UserStats, ChartData, etc.)
- `contexts/AuthContext.tsx`: JWT authentication context with subscription tier
- `App.tsx`: React Router configuration with protected and Premium routes

**API Config:** `VITE_API_URL` - Dev: `http://localhost:3000` | Prod: `http://72.61.166.22`
See [ENVIRONMENTS.md](frontend/ENVIRONMENTS.md).

### Tauri Desktop Integration

**Critical Architecture Detail:** The Tauri desktop application connects to the cloud backend API (NO local backend).

**Production Architecture:**
- Tauri app is a lightweight desktop wrapper around the React frontend
- All API calls go to `http://72.61.166.22` (VPS backend)
- No embedded Python or local backend process
- Requires internet connection to function

**Development vs Production:**
- Dev (`npm run tauri:dev`): Frontend connects to `http://localhost:3000` (local backend for testing)
- Prod (`npm run tauri:build`): Frontend connects to `http://72.61.166.22` (VPS backend)

**Config:** `tauri.conf.json` (window/bundle), `Cargo.toml` (deps), `.env.production` (API URL)

## Key Development Notes

**Authentication:** JWT tokens stored in localStorage (key: `fortiflow_token`). All API calls except login/register require `Authorization: Bearer <token>` header.

**Field Naming:** Database uses French names (nom, duree, code_map, tips) - maintain consistency when adding fields

**Testing:** pytest + pytest-asyncio. Tests use FastAPI TestClient with httpx for async.

**TypeScript:** `verbatimModuleSyntax` enabled - use `import type` for React types (ReactNode, FormEvent, etc).

**Timer Flow:** Backend uses asyncio.sleep() sequencing; frontend has client-side display (pause/resume).

**CORS:** `allow_origins=["*"]` - safe for localhost-only API. Required for Vite/Tauri protocols.

**Step Ordering:** `order` field (int) determines execution sequence, set automatically on creation.

**Configuration:** All config centralized in `backend/config.py` (env vars, limits, defaults). See [docs/backend/SUBSCRIPTIONS-COMPREHENSIVE.md](docs/backend/SUBSCRIPTIONS-COMPREHENSIVE.md) for details.

**Subscription Tiers:**
- **Free:** 2 routines max, no community/statistics
- **Premium (€3.99/month):** Unlimited routines, community access, statistics (grades/streaks/charts), leaderboard

**Premium Access:**
- Backend: `require_premium` dependency on protected routes
- Frontend: `<PremiumRoute>` wrapper or check `user.subscription_tier === 'premium'`

**Community:** Public routine sharing, tags (8 defaults), 5-star ratings, search/filters, pagination. See [docs/guides/COMMUNITY-COMPREHENSIVE.md](docs/guides/COMMUNITY-COMPREHENSIVE.md).

**Statistics:** Session tracking → grade levels (Bronze→Legend) based on completed routines + streak + time. Streaks break after 2+ days inactive. Leaderboard scoring: `routines*10 + streak*5 + time_hours*2`.

**Email:** SendGrid (prod) / console (dev). Verification + password reset flows. Templates in `backend/email_utils.py`.

**Stripe:** Checkout → webhooks → subscription sync. Portal for management. Test card: `4242 4242 4242 4242`. See [docs/backend/SUBSCRIPTIONS-COMPREHENSIVE.md](docs/backend/SUBSCRIPTIONS-COMPREHENSIVE.md).

**Migrations:** After pulling new features, check `backend/scripts/` for migration scripts. Run them to update your local database schema:
- `migrate_add_subscriptions.py` - Adds subscription tables and user fields
- `migrate_add_email_verification.py` - Adds email verification fields
- `migrate_add_avatar.py` - Adds avatar field to users
- All migrations support both SQLite (dev) and PostgreSQL (prod)

## Release & Distribution

**Quick:** `./scripts/prepare-release.sh <version>` → bumps versions + creates tag

**Manual:** Update `tauri.conf.json`, `Cargo.toml`, `package.json`, `docs/index.html` → create `v*.*.*` tag → push

**CI/CD:** `release.yml` builds Windows MSI/EXE on tag push. `pages.yml` deploys download page.

**Formats:** Windows (MSI+EXE) only (Linux/macOS builds disabled)

**Auto-Update:** Tauri updater plugin integrated. Users get automatic update notifications when new releases are published. See [AUTO_UPDATE.md](docs/release/AUTO_UPDATE.md) for setup and [SIGNING_KEYS_SETUP.md](docs/release/SIGNING_KEYS_SETUP.md) for key configuration.

See [QUICK_RELEASE.md](docs/release/QUICK_RELEASE.md) or [RELEASE.md](docs/release/RELEASE.md).

## Project Status

**Current Features:** Auth (JWT, email verification, password reset) | Routine management (CRUD, timer, auto-play) | Community (sharing, tags, ratings, search/filters) | Subscriptions (Stripe, Free/Premium) | Statistics (Premium: grades, streaks, charts, leaderboard) | Desktop app (Tauri v2, auto releases, auto-update)

**Planned:** V2 (HTTPS + custom domain) → V3 (React Native mobile) → V4 (advanced analytics, AI coaching)

## Testing

**Test Framework:** pytest with pytest-asyncio for async support. Tests use FastAPI TestClient with httpx.

**Running Tests:**
```bash
cd backend
pytest                    # All tests
pytest tests/test_*.py   # Specific file
pytest -v -s             # Verbose with output
pytest --cov             # With coverage
```

**Test Docs:** See [docs/guides/TESTING_GUIDE.md](docs/guides/TESTING_GUIDE.md) for procedures. Community test plan in [docs/guides/COMMUNITY-COMPREHENSIVE.md](docs/guides/COMMUNITY-COMPREHENSIVE.md).

**Testing Notes:**
- Restart backend after schema changes: `./run_backend.sh`
- Run migrations after pulling new features (see "Migrations" section above)
- Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)
- Use `pytest -v -s` to see detailed output and print statements during debugging

## Common Issues & Troubleshooting

**Backend won't start:**
- Check Python version: `python --version` (must be 3.10-3.12, NOT 3.13)
- Check if SECRET_KEY is set in `backend/.env` (app will fail if missing)
- Port 3000 already in use? Kill process: `lsof -ti:3000 | xargs kill -9` (macOS/Linux) or `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F` (Windows)

**Frontend can't connect to backend:**
- Check which API URL is configured: Look at `.env.development` or `.env.production` in frontend/
- Verify backend is running: `curl http://localhost:3000/health`
- Check browser console for CORS errors (backend must be running with CORS enabled)

**Database errors after pulling changes:**
- Run migrations from `backend/scripts/migrate_*.py`
- If migrations fail, backup your database and delete `backend/fortiflow.db`, then restart backend (creates fresh DB)

**Tauri build fails:**
- Ensure Rust is installed: `rustc --version` (install via rustup.rs if missing)
- Clear cache: `cd frontend && rm -rf src-tauri/target && npm run tauri:build`
- Check Node version: `node --version` (recommend v18 or v20 LTS)

**VPS deployment issues:**
- Verify SSH access: `ssh root@72.61.166.22`
- Check VPS services: `ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose ps"`
- View backend logs: `ssh root@72.61.166.22 "cd /opt/fortiflow/backend && docker compose logs -f backend"`
- Health check: `curl http://72.61.166.22/health`
