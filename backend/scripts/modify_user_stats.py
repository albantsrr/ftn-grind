#!/usr/bin/env python3
"""
Script to modify user statistics for testing purposes
"""
import sys
import os
import argparse
from datetime import datetime, timedelta

# Add parent directory to path to import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database URL
DATABASE_URL = "sqlite:///./fortiflow.db"

def modify_user_stats(username: str, routines: int = None, time_seconds: int = None, streak: int = None):
    """Modify user statistics for testing"""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get user ID
        user = session.execute(
            text("SELECT id, username FROM users WHERE username = :username"),
            {"username": username}
        ).fetchone()

        if not user:
            print(f"❌ User '{username}' not found")
            return False

        user_id = user[0]
        print(f"✅ Found user: {user[1]} (ID: {user_id})")

        # Get current stats
        current_stats = session.execute(
            text("""SELECT
                    COUNT(DISTINCT rs.id) as total_routines,
                    COALESCE(SUM(rs.total_duration), 0) as total_time
                FROM routine_sessions rs
                WHERE rs.user_id = :user_id AND rs.completed = 1"""),
            {"user_id": user_id}
        ).fetchone()

        current_routines = current_stats[0] if current_stats else 0
        current_time = current_stats[1] if current_stats else 0

        print(f"\n📊 Current Stats:")
        print(f"   Routines: {current_routines}")
        print(f"   Time: {current_time} seconds ({current_time // 60} minutes)")

        # Modify routines if specified
        if routines is not None:
            diff = routines - current_routines

            if diff > 0:
                # Add sessions
                print(f"\n➕ Adding {diff} routine sessions...")
                for i in range(diff):
                    # Create sessions over the last 30 days
                    days_ago = i % 30
                    date = datetime.now() - timedelta(days=days_ago)
                    duration = 300  # 5 minutes per routine

                    session.execute(
                        text("""INSERT INTO routine_sessions
                                (user_id, routine_id, started_at, completed_at, total_duration, completed, created_at)
                                VALUES
                                (:user_id, 1, :started_at, :completed_at, :duration, 1, :created_at)"""),
                        {
                            "user_id": user_id,
                            "started_at": date,
                            "completed_at": date + timedelta(seconds=duration),
                            "duration": duration,
                            "created_at": date
                        }
                    )
                session.commit()
                print(f"✅ Added {diff} sessions")
            elif diff < 0:
                # Remove sessions
                print(f"\n➖ Removing {abs(diff)} routine sessions...")
                session.execute(
                    text("""DELETE FROM routine_sessions
                            WHERE id IN (
                                SELECT id FROM routine_sessions
                                WHERE user_id = :user_id
                                ORDER BY created_at DESC
                                LIMIT :limit
                            )"""),
                    {"user_id": user_id, "limit": abs(diff)}
                )
                session.commit()
                print(f"✅ Removed {abs(diff)} sessions")

        # Modify time if specified
        if time_seconds is not None:
            new_total_time = time_seconds
            # Update all session durations proportionally
            if current_routines > 0:
                avg_duration = new_total_time // current_routines
                session.execute(
                    text("""UPDATE routine_sessions
                            SET total_duration = :avg_duration
                            WHERE user_id = :user_id AND completed = 1"""),
                    {"user_id": user_id, "avg_duration": avg_duration}
                )
                session.commit()
                print(f"✅ Updated total time to {new_total_time} seconds ({new_total_time // 60} minutes)")

        # Modify streak if specified (by adjusting session dates)
        if streak is not None:
            print(f"\n🔥 Setting streak to {streak} days...")
            # Get recent sessions
            recent_sessions = session.execute(
                text("""SELECT id FROM routine_sessions
                        WHERE user_id = :user_id AND completed = 1
                        ORDER BY created_at DESC
                        LIMIT :limit"""),
                {"user_id": user_id, "limit": streak}
            ).fetchall()

            if len(recent_sessions) < streak:
                # Need to add more sessions
                needed = streak - len(recent_sessions)
                print(f"   Adding {needed} sessions to reach streak...")
                for i in range(needed):
                    date = datetime.now() - timedelta(days=i)
                    session.execute(
                        text("""INSERT INTO routine_sessions
                                (user_id, routine_id, started_at, completed_at, total_duration, completed, created_at)
                                VALUES
                                (:user_id, 1, :started_at, :completed_at, 300, 1, :created_at)"""),
                        {
                            "user_id": user_id,
                            "started_at": date,
                            "completed_at": date + timedelta(seconds=300),
                            "created_at": date
                        }
                    )
                session.commit()

            # Update dates to create consecutive streak
            for i, session_row in enumerate(recent_sessions):
                date = datetime.now() - timedelta(days=i)
                session.execute(
                    text("""UPDATE routine_sessions
                            SET started_at = :date, completed_at = :completed_at, created_at = :date
                            WHERE id = :id"""),
                    {
                        "id": session_row[0],
                        "date": date,
                        "completed_at": date + timedelta(seconds=300)
                    }
                )
            session.commit()
            print(f"✅ Streak set to {streak} days")

        # Get final stats
        final_stats = session.execute(
            text("""SELECT
                    COUNT(DISTINCT rs.id) as total_routines,
                    COALESCE(SUM(rs.total_duration), 0) as total_time
                FROM routine_sessions rs
                WHERE rs.user_id = :user_id AND rs.completed = 1"""),
            {"user_id": user_id}
        ).fetchone()

        final_routines = final_stats[0] if final_stats else 0
        final_time = final_stats[1] if final_stats else 0

        print(f"\n📊 Final Stats:")
        print(f"   Routines: {final_routines}")
        print(f"   Time: {final_time} seconds ({final_time // 60} minutes)")
        print(f"\n✅ Statistics updated successfully!")

        return True

    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Modify user statistics for testing")
    parser.add_argument("username", help="Username to modify")
    parser.add_argument("--routines", "-r", type=int, help="Set total routines completed")
    parser.add_argument("--time", "-t", type=int, help="Set total time in seconds")
    parser.add_argument("--streak", "-s", type=int, help="Set current streak in days")

    args = parser.parse_args()

    if not (args.routines or args.time or args.streak):
        print("❌ Please specify at least one modification: --routines, --time, or --streak")
        parser.print_help()
        sys.exit(1)

    print(f"🔧 Modifying stats for user: {args.username}")
    if args.routines:
        print(f"   → Routines: {args.routines}")
    if args.time:
        print(f"   → Time: {args.time} seconds ({args.time // 60} minutes)")
    if args.streak:
        print(f"   → Streak: {args.streak} days")
    print()

    success = modify_user_stats(
        username=args.username,
        routines=args.routines,
        time_seconds=args.time,
        streak=args.streak
    )

    sys.exit(0 if success else 1)
