"""
Quick script to check database status

Usage:
    python check_db.py
"""

from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Routine, Tag, RoutineRating

def check_database():
    """Display database statistics"""
    db: Session = SessionLocal()

    try:
        print("=" * 60)
        print("  FortiFlow - Database Status")
        print("=" * 60)
        print()

        # Users
        users = db.query(User).all()
        print(f"👥 Users: {len(users)}")
        for user in users:
            routines_count = db.query(Routine).filter(Routine.user_id == user.id).count()
            public_count = db.query(Routine).filter(
                Routine.user_id == user.id,
                Routine.is_public == True
            ).count()
            print(f"   - {user.username:15s} ({user.email:30s}) - {routines_count} routines ({public_count} public)")
        print()

        # Routines
        total_routines = db.query(Routine).count()
        public_routines = db.query(Routine).filter(Routine.is_public == True).count()
        private_routines = total_routines - public_routines

        print(f"📋 Routines: {total_routines}")
        print(f"   - Public: {public_routines}")
        print(f"   - Private: {private_routines}")
        print()

        # Tags
        tags = db.query(Tag).all()
        print(f"🏷️  Tags: {len(tags)}")
        for tag in tags:
            # Count routines with this tag
            from sqlalchemy import text
            count = db.execute(
                text("SELECT COUNT(*) FROM routine_tags WHERE tag_id = :tag_id"),
                {"tag_id": tag.id}
            ).scalar()
            print(f"   - {tag.nom:15s} ({tag.color}) - {count} routines")
        print()

        # Ratings
        total_ratings = db.query(RoutineRating).count()
        print(f"⭐ Ratings: {total_ratings}")

        if total_ratings > 0:
            # Top rated routines
            top_rated = db.query(Routine).filter(
                Routine.total_ratings > 0
            ).order_by(Routine.average_rating.desc()).limit(5).all()

            if top_rated:
                print(f"\n🏆 Top 5 Rated Routines:")
                for i, routine in enumerate(top_rated, 1):
                    stars = "⭐" * int(round(routine.average_rating))
                    print(f"   {i}. {routine.nom[:40]:40s} {stars} {routine.average_rating:.1f} ({routine.total_ratings})")

        print()
        print("=" * 60)

        # Check if ready for testing
        print("\n✅ Readiness Check:")
        issues = []

        if len(users) == 0:
            issues.append("❌ No users found - Create an account in the app")
        elif len(users) == 1:
            issues.append("⚠️  Only 1 user - Create another account to test ratings")

        if len(tags) == 0:
            issues.append("❌ No tags found - Restart the backend to create default tags")

        if total_routines == 0:
            issues.append("❌ No routines found - Run seed_routines.py")

        if public_routines == 0:
            issues.append("⚠️  No public routines - Run seed_routines.py or share some routines")

        if total_ratings == 0:
            issues.append("💡 No ratings yet - Run seed_ratings.py or rate routines manually")

        if not issues:
            print("✅ Database looks good! Ready for testing.")
        else:
            for issue in issues:
                print(issue)

        print()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_database()
