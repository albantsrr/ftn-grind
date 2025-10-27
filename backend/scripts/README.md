# Backend Utility Scripts

This directory contains utility scripts for database management and development tasks. These scripts are not part of the production application.

## Available Scripts

### Database Seeding

#### `seed_routines.py`
Seeds the database with test routines for development and testing.

**Usage:**
```bash
cd backend
python scripts/seed_routines.py [count]
```

**Arguments:**
- `count` (optional): Number of routines to create (default: 30)

**Requirements:**
- User 'albant' must exist in the database
- Tags must be initialized (backend auto-creates default tags on startup)

**Example:**
```bash
python scripts/seed_routines.py 50
```

#### `seed_ratings.py`
Adds random ratings to existing public routines.

**Usage:**
```bash
cd backend
python scripts/seed_ratings.py
```

**Requirements:**
- At least 2 users in the database
- At least 1 public routine

**Notes:**
- Each routine gets 1-5 random ratings
- Ratings are weighted towards 4-5 stars (more realistic distribution)
- Automatically recalculates average ratings

### Database Management

#### `check_db.py`
Displays current database status and statistics.

**Usage:**
```bash
cd backend
python scripts/check_db.py
```

**Output:**
- User count and routine statistics per user
- Total routines (public/private breakdown)
- Tag usage statistics
- Rating statistics
- Top 5 rated routines
- Readiness check for testing

#### `migrate_add_email_verification.py`
Adds email verification and password reset fields to the users table.

**Usage:**
```bash
cd backend
python scripts/migrate_add_email_verification.py
```

**Fields Added:**
- `is_verified` (BOOLEAN) - Email verification status
- `verification_token` (TEXT) - Token for email verification
- `reset_token` (TEXT) - Token for password reset
- `reset_token_expires` (DATETIME) - Expiration for reset token

**Notes:**
- Safe to run multiple times (checks if columns already exist)
- Required for email verification and password reset features
- Only affects SQLite database (production uses PostgreSQL with proper migrations)

## Development Workflow

### Initial Setup
1. Start backend to create database and default tags
2. Register a test user (e.g., 'albant') via the app
3. Run `migrate_add_email_verification.py` if email features are needed
4. Run `seed_routines.py` to populate test data

### Testing Community Features
1. Run `seed_routines.py` to create test routines
2. Create additional test users via the app
3. Run `seed_ratings.py` to add ratings from different users
4. Use `check_db.py` to verify data

## Notes

- These scripts use the same database connection as the main application
- Scripts will fail gracefully if requirements aren't met
- Always run from the `backend` directory
- For production, use proper database migrations instead of these scripts

## See Also

- [EMAIL_VERIFICATION_GUIDE.md](../../EMAIL_VERIFICATION_GUIDE.md) - Email feature documentation
- [backend/DEPLOYMENT.md](../DEPLOYMENT.md) - Production deployment guide
