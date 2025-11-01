#!/usr/bin/env python3
"""
Migration script to add avatar_url column to users table.

This script adds support for user profile avatars (base64 encoded images).
Run this script after pulling the avatar feature updates.

Usage:
    python scripts/migrate_add_avatar.py
"""

import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import engine, SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    """Add avatar_url column to users table."""
    db = SessionLocal()
    try:
        # Check if column already exists
        result = db.execute(text("""
            SELECT COUNT(*) as count
            FROM pragma_table_info('users')
            WHERE name = 'avatar_url'
        """))
        exists = result.scalar() > 0

        if exists:
            logger.info("✓ Column 'avatar_url' already exists in users table")
            return

        # Add avatar_url column
        logger.info("Adding avatar_url column to users table...")
        db.execute(text("""
            ALTER TABLE users
            ADD COLUMN avatar_url TEXT
        """))
        db.commit()

        logger.info("✓ Successfully added avatar_url column to users table")
        logger.info("Migration complete!")

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("Avatar Migration Script")
    logger.info("=" * 60)

    try:
        migrate()
        logger.info("\n✓ All migrations completed successfully!")
    except Exception as e:
        logger.error(f"\n✗ Migration failed: {e}")
        sys.exit(1)
