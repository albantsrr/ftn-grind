"""
Script to add random ratings to public routines

Usage:
    python seed_ratings.py
"""

import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User, Routine, RoutineRating

# Ensure tables exist
Base.metadata.create_all(bind=engine)

def add_random_ratings():
    """Add random ratings to public routines from different users"""
    db: Session = SessionLocal()

    try:
        # Get all users
        all_users = db.query(User).all()
        if len(all_users) < 2:
            print("❌ Need at least 2 users to add ratings!")
            print("Please create another user account in the app.")
            return

        print(f"✓ Found {len(all_users)} users")

        # Get all public routines
        public_routines = db.query(Routine).filter(Routine.is_public == True).all()
        if not public_routines:
            print("❌ No public routines found!")
            print("Please run seed_routines.py first or share some routines.")
            return

        print(f"✓ Found {len(public_routines)} public routines")

        # Add ratings
        ratings_added = 0

        for routine in public_routines:
            # Each routine gets 1-5 ratings from random users
            num_ratings = random.randint(1, min(5, len(all_users) - 1))

            # Select random users (excluding routine owner)
            potential_raters = [u for u in all_users if u.id != routine.user_id]
            if not potential_raters:
                continue

            selected_raters = random.sample(potential_raters, min(num_ratings, len(potential_raters)))

            for rater in selected_raters:
                # Check if rating already exists
                existing = db.query(RoutineRating).filter(
                    RoutineRating.routine_id == routine.id,
                    RoutineRating.user_id == rater.id
                ).first()

                if existing:
                    continue

                # Create rating (weighted towards higher ratings)
                rating_value = random.choices(
                    [1, 2, 3, 4, 5],
                    weights=[5, 10, 20, 30, 35]  # More likely to give 4-5 stars
                )[0]

                rating = RoutineRating(
                    routine_id=routine.id,
                    user_id=rater.id,
                    rating=rating_value
                )
                db.add(rating)
                ratings_added += 1

            # Recalculate average for this routine
            all_ratings = db.query(RoutineRating).filter(
                RoutineRating.routine_id == routine.id
            ).all()

            if all_ratings:
                total = sum(r.rating for r in all_ratings)
                routine.average_rating = total / len(all_ratings)
                routine.total_ratings = len(all_ratings)

                print(f"  ⭐ {routine.nom[:40]:40s} - {routine.average_rating:.1f} ({routine.total_ratings} ratings)")

        # Commit all changes
        db.commit()

        print(f"\n✅ Successfully added {ratings_added} ratings!")

        # Summary
        print("\n📊 Summary:")
        top_rated = db.query(Routine).filter(
            Routine.is_public == True,
            Routine.total_ratings > 0
        ).order_by(Routine.average_rating.desc()).limit(5).all()

        if top_rated:
            print("\n🏆 Top 5 routines:")
            for i, routine in enumerate(top_rated, 1):
                stars = "⭐" * int(round(routine.average_rating))
                print(f"   {i}. {routine.nom[:35]:35s} {stars} {routine.average_rating:.1f} ({routine.total_ratings})")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  FortiFlow - Ratings Seeder")
    print("=" * 60)
    print()

    print("This will add random ratings to public routines")
    response = input("Continue? (y/n): ").lower().strip()

    if response == 'y':
        add_random_ratings()
    else:
        print("Cancelled.")
