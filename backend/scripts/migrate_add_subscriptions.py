#!/usr/bin/env python3
"""
Migration script to add subscription and routine_sessions tables.

This script:
1. Adds subscription_tier and trial_ends_at columns to users table
2. Creates subscriptions table with Stripe integration
3. Creates routine_sessions table for tracking workout sessions
4. Creates a default subscription record for all existing users (free tier)
"""

import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, SessionLocal
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migration():
    """Run the migration to add subscription and routine_sessions tables"""

    db = SessionLocal()

    try:
        logger.info("Starting migration: Adding subscription and routine_sessions tables")

        # Detect database type
        db_url = str(engine.url)
        is_sqlite = db_url.startswith("sqlite")

        logger.info(f"Detected database: {'SQLite' if is_sqlite else 'PostgreSQL'}")

        # Step 1: Add columns to users table
        logger.info("Step 1: Adding subscription_tier and trial_ends_at to users table")

        if is_sqlite:
            # SQLite doesn't support IF NOT EXISTS in ALTER TABLE or multiple columns at once
            # Try to add columns one by one, ignore if they exist
            try:
                db.execute(text("ALTER TABLE users ADD COLUMN subscription_tier VARCHAR DEFAULT 'free'"))
                db.commit()
                logger.info("✓ Added subscription_tier column")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    logger.info("  subscription_tier column already exists, skipping")
                    db.rollback()
                else:
                    raise

            try:
                db.execute(text("ALTER TABLE users ADD COLUMN trial_ends_at TIMESTAMP"))
                db.commit()
                logger.info("✓ Added trial_ends_at column")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    logger.info("  trial_ends_at column already exists, skipping")
                    db.rollback()
                else:
                    raise
        else:
            # PostgreSQL supports IF NOT EXISTS
            db.execute(text("""
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'free',
                ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;
            """))
            db.commit()
            logger.info("✓ Users table updated")

        # Step 2: Create subscriptions table
        logger.info("Step 2: Creating subscriptions table")
        if is_sqlite:
            # SQLite uses INTEGER PRIMARY KEY for autoincrement and 0/1 for BOOLEAN
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                    stripe_customer_id VARCHAR UNIQUE,
                    stripe_subscription_id VARCHAR UNIQUE,
                    subscription_status VARCHAR NOT NULL DEFAULT 'free',
                    current_period_start TIMESTAMP,
                    current_period_end TIMESTAMP,
                    cancel_at_period_end BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        else:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
                    stripe_customer_id VARCHAR UNIQUE,
                    stripe_subscription_id VARCHAR UNIQUE,
                    subscription_status VARCHAR NOT NULL DEFAULT 'free',
                    current_period_start TIMESTAMP,
                    current_period_end TIMESTAMP,
                    cancel_at_period_end BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        db.commit()
        logger.info("✓ Subscriptions table created")

        # Step 3: Create indexes on subscriptions table
        logger.info("Step 3: Creating indexes on subscriptions table")
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_subscriptions_id ON subscriptions(id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id)"))
        db.commit()
        logger.info("✓ Subscriptions indexes created")

        # Step 4: Create routine_sessions table
        logger.info("Step 4: Creating routine_sessions table")
        if is_sqlite:
            # SQLite uses AUTOINCREMENT instead of SERIAL
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS routine_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
                    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    total_duration INTEGER,
                    completed BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        else:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS routine_sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
                    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP,
                    total_duration INTEGER,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
        db.commit()
        logger.info("✓ Routine_sessions table created")

        # Step 5: Create indexes on routine_sessions table
        logger.info("Step 5: Creating indexes on routine_sessions table")
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_routine_sessions_id ON routine_sessions(id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_routine_sessions_user_id ON routine_sessions(user_id)"))
        db.commit()
        logger.info("✓ Routine_sessions indexes created")

        # Step 6: Create default subscription records for existing users
        logger.info("Step 6: Creating default subscription records for existing users")
        db.execute(text("""
            INSERT INTO subscriptions (user_id, subscription_status, created_at, updated_at)
            SELECT id, 'free', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            FROM users
            WHERE id NOT IN (SELECT user_id FROM subscriptions);
        """))
        db.commit()
        logger.info("✓ Default subscription records created")

        logger.info("=" * 60)
        logger.info("Migration completed successfully! ✓")
        logger.info("=" * 60)
        logger.info("Summary:")
        logger.info("  - Added subscription_tier and trial_ends_at to users table")
        logger.info("  - Created subscriptions table with Stripe integration")
        logger.info("  - Created routine_sessions table for workout tracking")
        logger.info("  - All existing users set to 'free' tier by default")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        logger.error(f"Failed to run migration: {e}")
        sys.exit(1)
