"""
Migration script to add game_type column to routine_steps table.

This script adds the game_type field to support both Fortnite and Kovaak's exercises.
"""

import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database import engine, SessionLocal
from models import Base


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def migrate():
    """Add game_type column to routine_steps table if it doesn't exist."""
    db = SessionLocal()

    try:
        print("🚀 Starting migration: Add game_type to routine_steps")

        # Check if column already exists
        if column_exists('routine_steps', 'game_type'):
            print("✅ Column 'game_type' already exists in routine_steps table")
            return

        print("📝 Adding game_type column to routine_steps...")

        # Detect database type
        db_url = str(engine.url)
        is_sqlite = 'sqlite' in db_url
        is_postgresql = 'postgresql' in db_url

        if is_sqlite:
            # SQLite: Add column with default value
            db.execute(text(
                "ALTER TABLE routine_steps ADD COLUMN game_type VARCHAR DEFAULT 'fortnite'"
            ))
        elif is_postgresql:
            # PostgreSQL: Add column with default value
            db.execute(text(
                "ALTER TABLE routine_steps ADD COLUMN game_type VARCHAR DEFAULT 'fortnite'"
            ))
        else:
            raise Exception(f"Unsupported database type: {db_url}")

        db.commit()
        print("✅ Migration completed successfully!")
        print("   - Added 'game_type' column to routine_steps table")
        print("   - Default value set to 'fortnite' for existing rows")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
