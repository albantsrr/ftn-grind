"""
Script to seed the database with test routines for user 'albant'

Usage:
    python seed_routines.py
"""

import sys
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User, Routine, RoutineStep, Tag, routine_tags

# Ensure tables exist
Base.metadata.create_all(bind=engine)

# Routine names and descriptions
ROUTINE_NAMES = [
    # Aim routines
    "Warm-up Aim Training",
    "Flick Shot Practice",
    "Tracking Master",
    "Precision Training",
    "Speed Aim Challenge",

    # Build routines
    "90s Practice Basic",
    "90s Speed Run",
    "Double Edit Warm-up",
    "Triple Edit Master",
    "Retake Practice",
    "High Ground Retakes",
    "Protected Sides Build",

    # Edit routines
    "Fast Edit Course",
    "Edit Reset Training",
    "Window Edit Practice",
    "Cone Edit Master",

    # Movement
    "Movement Mechanics",
    "Parkour Training",
    "Jump Fatigue Practice",

    # Box Fight
    "Box Fight Warm-up",
    "1v1 Box Fight",
    "Piece Control Practice",

    # Zone Wars
    "Zone Wars Rotation",
    "End Game Practice",
    "Storm Surge Training",

    # Creative
    "Creative Deathrun",
    "Creative Puzzle Map",
    "Edit Course Pro",
    "Aim Course Advanced",
    "Build Course Expert",
    "Combo Practice Arena",
    "Ultimate Training Mix"
]

STEP_TEMPLATES = [
    # Aim steps
    {"nom": "Flick shots (180°)", "code_map": "Tile Frenzy", "duree": 300, "tips": "Focus on precision over speed"},
    {"nom": "Tracking practice", "code_map": "Bounce Tracking", "duree": 240, "tips": "Smooth mouse movements"},
    {"nom": "Target switching", "code_map": "Multi Target", "duree": 180, "tips": "Quick reflex training"},
    {"nom": "Long range practice", "code_map": "Distance Aim", "duree": 200, "tips": "Control your breathing"},

    # Build steps
    {"nom": "90s continuous", "code_map": "Infinite 90s", "duree": 300, "tips": "Focus on crosshair placement"},
    {"nom": "Protected sides", "code_map": "Side Jump", "duree": 180, "tips": "Place floor first"},
    {"nom": "Speed 90s", "code_map": "Timed 90s", "duree": 120, "tips": "Maximum speed challenge"},
    {"nom": "Double ramp rush", "code_map": "Ramp Course", "duree": 150, "tips": "Keep momentum"},
    {"nom": "High wall retakes", "code_map": "Retake Map", "duree": 240, "tips": "Multiple angles approach"},

    # Edit steps
    {"nom": "Window edits", "code_map": "Edit Course", "duree": 180, "tips": "Reset fast after edit"},
    {"nom": "Cone edits", "code_map": "Cone Master", "duree": 150, "tips": "Practice different angles"},
    {"nom": "Speed edits", "code_map": "Timed Edits", "duree": 200, "tips": "Accuracy over speed initially"},
    {"nom": "Double edit", "code_map": "Edit Chain", "duree": 220, "tips": "Smooth transitions"},

    # Movement steps
    {"nom": "Jump fatigue", "code_map": "Parkour Pro", "duree": 180, "tips": "Timing is everything"},
    {"nom": "Slide mechanics", "code_map": "Slide Course", "duree": 120, "tips": "Maintain speed"},
    {"nom": "Sprint practice", "code_map": "Speed Run", "duree": 150, "tips": "Optimal pathing"},

    # Box Fight steps
    {"nom": "Piece control", "code_map": "Box Fight Arena", "duree": 300, "tips": "Take walls aggressively"},
    {"nom": "Shot timing", "code_map": "1v1 Box", "duree": 240, "tips": "Peek smartly"},
    {"nom": "Reset practice", "code_map": "Reset Box", "duree": 180, "tips": "Don't overcommit"},

    # Zone Wars steps
    {"nom": "Rotation practice", "code_map": "Zone Simulator", "duree": 300, "tips": "Plan your path early"},
    {"nom": "Storm surge", "code_map": "Late Game", "duree": 240, "tips": "Deal damage consistently"},
    {"nom": "Box up practice", "code_map": "End Game Box", "duree": 180, "tips": "Stay unpredictable"},
]

def get_random_steps(count=3):
    """Get random steps for a routine"""
    selected = random.sample(STEP_TEMPLATES, min(count, len(STEP_TEMPLATES)))
    steps = []
    for i, step_template in enumerate(selected):
        step = {
            **step_template,
            "order": i,
            "duree": random.randint(120, 360)  # Random duration 2-6 minutes
        }
        steps.append(step)
    return steps

def get_tag_ids_for_routine(routine_name, all_tags):
    """Assign appropriate tags based on routine name"""
    tag_map = {
        "Aim": ["aim", "warm-up"],
        "Flick": ["aim"],
        "Tracking": ["aim"],
        "Precision": ["aim"],
        "Speed Aim": ["aim"],
        "90s": ["build", "warm-up"],
        "Edit": ["edit"],
        "Double Edit": ["edit", "build"],
        "Triple Edit": ["edit"],
        "Retake": ["build"],
        "High Ground": ["build"],
        "Protected": ["build"],
        "Movement": ["movement"],
        "Parkour": ["movement"],
        "Jump": ["movement"],
        "Box Fight": ["box-fight"],
        "1v1": ["box-fight"],
        "Piece Control": ["box-fight", "build"],
        "Zone Wars": ["zone-wars"],
        "End Game": ["zone-wars"],
        "Storm": ["zone-wars"],
        "Creative": ["creative"],
        "Deathrun": ["creative", "movement"],
        "Puzzle": ["creative"],
        "Warm-up": ["warm-up"],
    }

    # Find matching tags
    selected_tag_names = set()
    for keyword, tag_names in tag_map.items():
        if keyword.lower() in routine_name.lower():
            selected_tag_names.update(tag_names)

    # If no match, assign random tag
    if not selected_tag_names:
        selected_tag_names.add(random.choice(["aim", "build", "edit", "movement"]))

    # Convert tag names to IDs
    tag_ids = []
    for tag in all_tags:
        if tag.nom.lower().replace(" ", "-") in selected_tag_names:
            tag_ids.append(tag.id)

    return tag_ids

def seed_routines(count=30):
    """Seed database with test routines"""
    db: Session = SessionLocal()

    try:
        # Find user 'albant'
        user = db.query(User).filter(User.username == "albant").first()
        if not user:
            print("❌ User 'albant' not found!")
            print("Please create the user first by registering in the app.")
            return

        print(f"✓ Found user: {user.username} (ID: {user.id})")

        # Get all tags
        all_tags = db.query(Tag).all()
        if not all_tags:
            print("❌ No tags found! Make sure the backend has created default tags.")
            return

        print(f"✓ Found {len(all_tags)} tags")

        # Delete existing routines for this user (optional - uncomment if needed)
        # existing_count = db.query(Routine).filter(Routine.user_id == user.id).count()
        # if existing_count > 0:
        #     db.query(Routine).filter(Routine.user_id == user.id).delete()
        #     print(f"✓ Deleted {existing_count} existing routines")

        # Create routines
        routines_created = 0
        sound_types = ["beep", "bell", "chime", "notification"]

        # Shuffle routine names and take what we need
        available_names = ROUTINE_NAMES.copy()
        random.shuffle(available_names)

        for i in range(min(count, len(available_names))):
            routine_name = available_names[i]

            # Random date within last 30 days
            days_ago = random.randint(0, 30)
            routine_date = datetime.utcnow() - timedelta(days=days_ago)

            # 70% chance to be public
            is_public = random.random() < 0.7

            # Create routine
            routine = Routine(
                user_id=user.id,
                nom=routine_name,
                date=routine_date,
                sound_type=random.choice(sound_types),
                volume=random.randint(50, 100),
                image_url=None,
                is_public=is_public,
                author_name=user.username if is_public else None,
                average_rating=0.0,
                total_ratings=0
            )

            db.add(routine)
            db.flush()  # Get the routine ID

            # Add steps
            steps = get_random_steps(count=random.randint(2, 5))
            for step_data in steps:
                step = RoutineStep(
                    routine_id=routine.id,
                    **step_data
                )
                db.add(step)

            # Add tags
            tag_ids = get_tag_ids_for_routine(routine_name, all_tags)
            for tag_id in tag_ids:
                db.execute(
                    routine_tags.insert().values(
                        routine_id=routine.id,
                        tag_id=tag_id
                    )
                )

            routines_created += 1
            status = "📢 PUBLIC" if is_public else "🔒 PRIVATE"
            print(f"  [{routines_created}/{count}] {status} - {routine_name} ({len(steps)} steps, {len(tag_ids)} tags)")

        # Commit all changes
        db.commit()

        print(f"\n✅ Successfully created {routines_created} routines for user '{user.username}'!")

        # Add some ratings to public routines
        public_routines = db.query(Routine).filter(
            Routine.user_id == user.id,
            Routine.is_public == True
        ).all()

        if public_routines:
            print(f"\n💡 Tip: {len(public_routines)} routines are public. You can add ratings to them from another user account!")

        # Summary
        print("\n📊 Summary:")
        print(f"   Total routines: {routines_created}")
        print(f"   Public routines: {sum(1 for r in db.query(Routine).filter(Routine.user_id == user.id, Routine.is_public == True).all())}")
        print(f"   Private routines: {sum(1 for r in db.query(Routine).filter(Routine.user_id == user.id, Routine.is_public == False).all())}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("  FortiFlow - Routine Seeder")
    print("=" * 60)
    print()

    # Ask for confirmation
    count = 30
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid count. Using default: 30")

    print(f"This will create {count} test routines for user 'albant'")
    response = input("Continue? (y/n): ").lower().strip()

    if response == 'y':
        seed_routines(count)
    else:
        print("Cancelled.")
