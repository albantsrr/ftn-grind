from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models import User, RoutineSession
from auth import get_current_user
from config import GradeRequirements

router = APIRouter(prefix="/api/leaderboard", tags=["leaderboard"])


def calculate_score(routines: int, streak: int, time_hours: float) -> int:
    """Calculate total score based on routines, streak, and time"""
    # Score formula: routines * 10 + streak * 5 + time_hours * 2
    return int(routines * 10 + streak * 5 + time_hours * 2)


def calculate_streak(sessions: list, user_id: int) -> tuple[int, int]:
    """Calculate current and longest streak for a user"""
    if not sessions:
        return 0, 0

    # Get unique dates with completed sessions
    dates = sorted(set(session.completed_at.date() for session in sessions if session.completed_at))

    if not dates:
        return 0, 0

    current_streak = 0
    longest_streak = 0
    temp_streak = 1

    # Check if current streak is active (last activity within 2 days)
    today = datetime.now().date()
    if dates[-1] >= today - timedelta(days=1):
        current_streak = 1

        # Calculate current streak backwards from most recent
        for i in range(len(dates) - 1, 0, -1):
            if (dates[i] - dates[i-1]).days == 1:
                current_streak += 1
            else:
                break

    # Calculate longest streak
    for i in range(1, len(dates)):
        if (dates[i] - dates[i-1]).days == 1:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1

    longest_streak = max(longest_streak, temp_streak, current_streak)

    return current_streak, longest_streak


def determine_grade(routines: int, longest_streak: int, time_hours: float) -> str:
    """
    Determine grade based on routines, streak, and time.
    Uses the same logic as frontend/backend statistics.
    """
    # Start from highest grade and work down
    grades = [
        ("Legend", GradeRequirements.LEGEND),
        ("Diamond", GradeRequirements.DIAMOND),
        ("Platinum", GradeRequirements.PLATINUM),
        ("Gold", GradeRequirements.GOLD),
        ("Silver", GradeRequirements.SILVER),
        ("Bronze", GradeRequirements.BRONZE),
    ]

    for grade_name, requirements in grades:
        if (routines >= requirements["routines"] and
            longest_streak >= requirements["streak"] and
            time_hours >= requirements["time_hours"]):
            return grade_name

    return "Bronze"  # Default grade


@router.get("")
async def get_leaderboard(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get global leaderboard with rankings.
    Returns top players sorted by total score.
    """

    # Subquery to get stats for each user
    stats_subquery = (
        db.query(
            RoutineSession.user_id,
            func.count(RoutineSession.id).label('total_routines'),
            func.sum(RoutineSession.total_duration).label('total_time')
        )
        .filter(RoutineSession.completed == True)
        .group_by(RoutineSession.user_id)
        .subquery()
    )

    # Main query to get all users with their stats
    query = (
        db.query(
            User.id,
            User.username,
            User.subscription_tier,
            func.coalesce(stats_subquery.c.total_routines, 0).label('total_routines'),
            func.coalesce(stats_subquery.c.total_time, 0).label('total_time')
        )
        .outerjoin(stats_subquery, User.id == stats_subquery.c.user_id)
        .filter(User.is_active == True)
    )

    # Apply search filter
    if search:
        query = query.filter(User.username.ilike(f"%{search}%"))

    users_data = query.all()

    # Calculate streaks and scores for each user
    leaderboard_entries = []
    for user_data in users_data:
        user_id, username, subscription_tier, total_routines, total_time = user_data

        # Get sessions for streak calculation
        sessions = db.query(RoutineSession).filter(
            RoutineSession.user_id == user_id,
            RoutineSession.completed == True
        ).order_by(RoutineSession.completed_at).all()

        current_streak, longest_streak = calculate_streak(sessions, user_id)

        # Calculate total score
        time_hours = (total_time or 0) / 3600
        total_score = calculate_score(total_routines, longest_streak, time_hours)

        # Determine grade using the correct logic
        grade = determine_grade(total_routines, longest_streak, time_hours)

        leaderboard_entries.append({
            'user_id': user_id,
            'username': username,
            'grade': grade,
            'total_score': total_score,
            'total_routines_completed': total_routines,
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'total_time_seconds': total_time or 0,
            'is_premium': subscription_tier == 'premium',
            'is_current_user': user_id == current_user.id
        })

    # Sort by total score descending
    leaderboard_entries.sort(key=lambda x: x['total_score'], reverse=True)

    # Add positions
    for i, entry in enumerate(leaderboard_entries, start=1):
        entry['position'] = i

    # Find current user entry
    current_user_entry = next(
        (entry for entry in leaderboard_entries if entry['is_current_user']),
        None
    )

    # Apply pagination
    paginated_entries = leaderboard_entries[offset:offset + limit]

    # Get current season (month-year)
    season = datetime.now().strftime("%B %Y")

    return {
        'entries': paginated_entries,
        'current_user_entry': current_user_entry,
        'total_count': len(leaderboard_entries),
        'season': season
    }
