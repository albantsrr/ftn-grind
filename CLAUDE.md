# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FortiFlow is a desktop training application for Fortnite players. Users create training routines with multiple timed steps (exercises on specific Fortnite maps), then execute them with an integrated timer, sound alerts, and instructions.

## Technical Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS + React Router
- **Backend**: FastAPI + SQLAlchemy ORM (Python 3.10-3.12)
- **Database**: SQLite (local file: `backend/fortiflow.db`)
- **Desktop**: Tauri v2 (Rust) - connects to cloud backend API
- **Testing**: pytest with async support

**Python Version Requirements:**
- **Development & Production**: Python 3.10, 3.11, or 3.12 only (NOT 3.13 - dependency incompatibility)
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
- `routers/timer.py`: Timer execution with asyncio

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

**Key API Endpoints:**

*Authentication:*
- `POST /api/auth/login`: Login with username/password (returns JWT)
- `POST /api/auth/register`: Register new user (sends verification email)
- `GET /api/auth/me`: Get current user info
- `POST /api/auth/verify-email`: Verify email with token
- `POST /api/auth/resend-verification`: Resend verification email
- `POST /api/auth/forgot-password`: Request password reset (sends email)
- `POST /api/auth/reset-password`: Reset password with token
- `PUT /api/auth/update-profile`: Update user profile
- `POST /api/auth/change-password`: Change password (requires current password)

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

*Subscriptions:*
- `POST /api/subscriptions/create-checkout-session`: Create Stripe checkout session (redirect to Stripe)
- `GET /api/subscriptions/portal`: Create Stripe Customer Portal session (manage subscription)
- `GET /api/subscriptions/status`: Get current user's subscription status
- `POST /api/subscriptions/webhook`: Stripe webhook handler (checkout.session.completed, customer.subscription.*)

*Statistics (Premium only):*
- `POST /api/statistics/session/start`: Start tracking a routine session
- `POST /api/statistics/session/{id}/complete`: Mark session as completed with duration
- `GET /api/statistics/me`: Get user stats (total completed, time, streaks, grade)
- `GET /api/statistics/chart-data`: Get 30-day chart data (routines/day, duration/day)
- `GET /api/statistics/sessions/recent`: Get recent sessions (default limit: 10)

**Environments:**
- Dev: `http://localhost:3000` (SQLite, local testing)
- Prod: `http://72.61.166.22` (PostgreSQL+Docker on VPS)

**Production Deployment:**
```bash
# Quick deploy to VPS (from project root)
./scripts/deploy-backend.sh

# What it does:
# 1. Syncs backend files via rsync (excludes venv, db, tests)
# 2. Rebuilds and restarts Docker containers
# 3. Runs health check on /health endpoint
# 4. Shows recent logs
```

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

**Configuration:** All backend configuration centralized in `backend/config.py` including:
- Environment variables (SECRET_KEY, Stripe, SendGrid)
- Subscription limits (FREE_MAX_ROUTINES: 2, PREMIUM: unlimited)
- Community settings (pagination, search)
- Rating settings (1-5 stars)
- Default tags (8 pre-seeded tags)
- Grade requirements (Bronze → Legend based on routines completed + streak)

**Subscription Tiers:**
- **Free:** 2 routines max, no statistics, community access
- **Premium:** Unlimited routines, statistics with charts, grades, streak tracking

**Grade System:** Based on routines completed + current streak:
- Bronze: 5 routines + 3 days streak
- Silver: 20 routines + 7 days streak
- Gold: 50 routines + 15 days streak
- Platinum: 100 routines + 30 days streak
- Diamond: 250 routines + 60 days streak
- Legend: 500 routines + 100 days streak

**Streak Calculation:** Consecutive days with at least one completed routine. Breaks if no activity for 2+ days.

**Premium Access Control:**
- Backend: Use `require_premium` dependency in route decorators for Premium-only endpoints
- Frontend: Use `<PremiumRoute>` wrapper for Premium-only pages or check `user.subscription_tier === 'premium'`
- Free tier limit enforced on routine creation (max 2 routines)
- Statistics endpoints automatically return 403 for Free users

**Session Tracking Flow:**
1. User starts routine → Frontend calls `POST /api/statistics/session/start` with routine_id
2. Returns session_id and started_at timestamp
3. User completes routine → Frontend calculates total_duration and calls `POST /api/statistics/session/{id}/complete`
4. Backend updates session record with completed=true, completed_at, total_duration
5. Statistics endpoints query routine_sessions to calculate streaks, grades, charts

**Community Features:**
- **Sharing:** Users can toggle routines public/private. Public routines appear in Community page.
- **Tags:** Pre-seeded with 8 default tags (Aim, Build, Edit, Movement, etc.). Many-to-many relationship.
- **Ratings:** Users can rate public routines 1-5 stars. One rating per user per routine. Average is recalculated on each rating change.
- **Search & Filters:** Community page supports searching by name, filtering by tags, filtering by author, and sorting (date/name/rating).
- **Pagination:** Community shows 12 routines per page with navigation controls.
- **UX Polish:** Skeleton loaders, fade-in animations, tooltips, improved error messages.

**Email & Account Management:**
- **Email Verification:** Users receive verification email after registration via SendGrid in production.
- **Password Reset:** "Forgot password" flow with email-based token reset.
- **Profile Settings:** Users can update username, email, full name, and password in Settings page.
- **Email Service:** Uses SendGrid API in production (configured via environment variables), console logging in dev.
- **Configuration:** Set `USE_REAL_EMAIL=true` and `SENDGRID_API_KEY` in backend `.env` file.
- **Email Templates:** Professional HTML emails with FortiFlow branding in `backend/email_utils.py`.
- **Security:** 24-hour token expiration, bcrypt password hashing, protection against email enumeration.

**Stripe Integration:**
- **Checkout Flow:** User clicks "Upgrade to Premium" → backend creates Stripe Checkout session → user redirected to Stripe → webhook handles completion
- **Webhooks:** Handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **Customer Portal:** Users can manage subscription, update payment method, view invoices via Stripe Customer Portal
- **Environment Variables:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- **Subscription Sync:** User's `subscription_tier` updated automatically via webhooks (active → premium, canceled → free)

**Database Migrations:**
- **Email Verification:** Run `backend/scripts/migrate_add_email_verification.py` to add email fields
- **Subscriptions:** Run `backend/scripts/migrate_add_subscriptions.py` to add subscriptions, routine_sessions tables and subscription_tier to users
- Both migrations support SQLite and PostgreSQL with idempotent operations

## Release & Distribution

**Quick:** `./scripts/prepare-release.sh <version>` → bumps versions + creates tag

**Manual:** Update `tauri.conf.json`, `Cargo.toml`, `package.json`, `docs/index.html` → create `v*.*.*` tag → push

**CI/CD:** `release.yml` builds Windows MSI/EXE on tag push. `pages.yml` deploys download page.

**Formats:** Windows (MSI+EXE) only (Linux/macOS builds disabled)

See [QUICK_RELEASE.md](docs/release/QUICK_RELEASE.md) or [RELEASE.md](docs/release/RELEASE.md).

## Project Status

**Current Features:**
- ✅ User authentication (JWT-based login/register)
- ✅ Email verification and password reset (SendGrid production, console dev)
- ✅ User profile management (update email, username, password)
- ✅ Private routine management (CRUD with steps)
- ✅ Timer execution with sound alerts and auto-play
- ✅ Community system (share routines publicly)
- ✅ Tag system (categorize routines)
- ✅ Rating system (1-5 stars)
- ✅ Advanced search & filters (by name, tags, author)
- ✅ Pagination & UX polish (skeleton loaders, animations, tooltips)
- ✅ Desktop app (Tauri v2) with automated releases
- ✅ **Subscription system (Stripe integration, Free/Premium tiers)**
- ✅ **Statistics & analytics (Premium only: grades, streaks, charts)**
- ✅ **Routine session tracking for statistics**

**Planned:** V2 (custom domain + HTTPS) → V3 (React Native mobile app) → V4 (advanced analytics, coaching AI)

**Recent Updates:**
- ✅ Stripe subscription system with checkout and webhooks
- ✅ Statistics system with grade levels (Bronze → Legend) and streak tracking
- ✅ Routine session tracking for workout analytics
- ✅ Premium paywall and billing page
- ✅ Centralized configuration in `backend/config.py`
- ✅ Database migrations for subscriptions and sessions
- ✅ Auto-play feature for seamless routine execution
- ✅ Production deployment ready with full VPS integration

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

**Test Documentation:**
- [docs/guides/TESTING_GUIDE.md](docs/guides/TESTING_GUIDE.md) - Testing procedures and guidelines
- [docs/guides/TEST_COMMUNITY_FEATURES.md](docs/guides/TEST_COMMUNITY_FEATURES.md) - Manual test plan for community features
- [docs/guides/COMMUNITY_FEATURES_SUMMARY.md](docs/guides/COMMUNITY_FEATURES_SUMMARY.md) - Feature implementation summary
- [docs/guides/UX_IMPROVEMENTS_COMMUNITY.md](docs/guides/UX_IMPROVEMENTS_COMMUNITY.md) - UX/UI enhancements

**Important Notes:**
- Before testing new features, restart backend to apply schema changes: `Ctrl+C` then `./run_backend.sh`
- After pulling subscription/statistics features, run migration: `python backend/scripts/migrate_add_subscriptions.py`
- For Stripe testing, use Stripe test mode with test card: `4242 4242 4242 4242`
