"""
Migration script to add email verification and password reset fields to users table.
Run this script to update existing database schema.
"""
import sqlite3
from pathlib import Path

# Database is at backend/fortiflow.db (one level up from scripts/)
DB_PATH = Path(__file__).parent.parent / "fortiflow.db"

def migrate():
    """Add new columns to users table for email verification and password reset."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]

        migrations_applied = []

        # Add is_verified column
        if 'is_verified' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
            migrations_applied.append("is_verified")
            print("✅ Added 'is_verified' column")

        # Add verification_token column
        if 'verification_token' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN verification_token TEXT")
            migrations_applied.append("verification_token")
            print("✅ Added 'verification_token' column")

        # Add reset_token column
        if 'reset_token' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
            migrations_applied.append("reset_token")
            print("✅ Added 'reset_token' column")

        # Add reset_token_expires column
        if 'reset_token_expires' not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME")
            migrations_applied.append("reset_token_expires")
            print("✅ Added 'reset_token_expires' column")

        conn.commit()

        if migrations_applied:
            print(f"\n✅ Migration completed successfully! Added {len(migrations_applied)} column(s).")
        else:
            print("\n✅ No migration needed. All columns already exist.")

    except sqlite3.Error as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔄 Starting database migration...")
    print(f"📂 Database: {DB_PATH}")
    print()
    migrate()
