from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import (
    User, RoutineSession, Routine,
    RoutineSessionCreate, RoutineSessionResponse, RoutineSessionComplete,
    UserStatsResponse, ChartDataResponse, ChartDataPoint
)
from auth import get_current_active_user, require_premium
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# Helper function to calculate grade based on routines completed, streak, and time
def calculate_grade(routines_completed: int, longest_streak: int, total_time_seconds: int) -> str:
    """
    Calculate user grade based on routines completed, longest streak, and total time.

    Grade requirements (all 3 must be met):
    - Bronze: 10 routines + 5 days streak + 1 hour
    - Silver: 50 routines + 15 days streak + 5 hours
    - Gold: 150 routines + 30 days streak + 15 hours
    - Platinum: 300 routines + 60 days streak + 30 hours
    - Diamond: 600 routines + 120 days streak + 60 hours
    - Legend: 1000 routines + 200 days streak + 100 hours
    """
    from config import GradeRequirements

    total_time_hours = total_time_seconds / 3600  # Convert to hours

    # Check grades from highest to lowest
    if (routines_completed >= GradeRequirements.LEGEND["routines"] and
        longest_streak >= GradeRequirements.LEGEND["streak"] and
        total_time_hours >= GradeRequirements.LEGEND["time_hours"]):
        return "Legend"
    elif (routines_completed >= GradeRequirements.DIAMOND["routines"] and
          longest_streak >= GradeRequirements.DIAMOND["streak"] and
          total_time_hours >= GradeRequirements.DIAMOND["time_hours"]):
        return "Diamond"
    elif (routines_completed >= GradeRequirements.PLATINUM["routines"] and
          longest_streak >= GradeRequirements.PLATINUM["streak"] and
          total_time_hours >= GradeRequirements.PLATINUM["time_hours"]):
        return "Platinum"
    elif (routines_completed >= GradeRequirements.GOLD["routines"] and
          longest_streak >= GradeRequirements.GOLD["streak"] and
          total_time_hours >= GradeRequirements.GOLD["time_hours"]):
        return "Gold"
    elif (routines_completed >= GradeRequirements.SILVER["routines"] and
          longest_streak >= GradeRequirements.SILVER["streak"] and
          total_time_hours >= GradeRequirements.SILVER["time_hours"]):
        return "Silver"
    elif (routines_completed >= GradeRequirements.BRONZE["routines"] and
          longest_streak >= GradeRequirements.BRONZE["streak"] and
          total_time_hours >= GradeRequirements.BRONZE["time_hours"]):
        return "Bronze"
    else:
        return "Bronze"  # Default grade


def calculate_streak(db: Session, user_id: int) -> tuple[int, int]:
    """
    Calculate current streak and longest streak for a user.

    A streak is maintained if the user completes at least one routine per day.
    Returns (current_streak, longest_streak) in days.
    """
    # Get all completed sessions ordered by completion date
    completed_sessions = db.query(RoutineSession).filter(
        and_(
            RoutineSession.user_id == user_id,
            RoutineSession.completed == True,
            RoutineSession.completed_at.isnot(None)
        )
    ).order_by(RoutineSession.completed_at.desc()).all()

    if not completed_sessions:
        return (0, 0)

    # Get unique completion dates (ignoring time)
    completion_dates = set()
    for session in completed_sessions:
        if session.completed_at:
            date_only = session.completed_at.date()
            completion_dates.add(date_only)

    # Sort dates in descending order
    sorted_dates = sorted(completion_dates, reverse=True)

    # Calculate current streak
    current_streak = 0
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)

    # Check if there's activity today or yesterday to start counting
    if sorted_dates[0] == today or sorted_dates[0] == yesterday:
        current_streak = 1
        expected_date = sorted_dates[0] - timedelta(days=1)

        for i in range(1, len(sorted_dates)):
            if sorted_dates[i] == expected_date:
                current_streak += 1
                expected_date = expected_date - timedelta(days=1)
            else:
                break

    # Calculate longest streak
    longest_streak = 0
    temp_streak = 1

    for i in range(len(sorted_dates) - 1):
        diff = (sorted_dates[i] - sorted_dates[i + 1]).days
        if diff == 1:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1

    longest_streak = max(longest_streak, temp_streak)
    longest_streak = max(longest_streak, current_streak)

    return (current_streak, longest_streak)


@router.post("/session/start", response_model=RoutineSessionResponse)
async def start_session(
    session_data: RoutineSessionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Start a new routine session for tracking.

    This creates a session record with the start time.
    Call /complete when the routine is finished.
    """
    logger.info(f"Starting session for routine {session_data.routine_id} by user {current_user.id}")

    # Verify routine exists and belongs to user or is public
    routine = db.query(Routine).filter(Routine.id == session_data.routine_id).first()
    if not routine:
        raise HTTPException(
            status_code=404,
            detail="Routine not found"
        )

    # Check if user has access to this routine
    if routine.user_id != current_user.id and not routine.is_public:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this routine"
        )

    # Create session
    session = RoutineSession(
        user_id=current_user.id,
        routine_id=session_data.routine_id,
        started_at=datetime.utcnow(),
        completed=False
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    logger.info(f"Session {session.id} started for user {current_user.id}")
    return session


@router.post("/session/{session_id}/complete", response_model=RoutineSessionResponse)
async def complete_session(
    session_id: int,
    completion_data: RoutineSessionComplete,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark a session as completed with the total duration.

    The total_duration should be calculated by the frontend (in seconds).
    """
    logger.info(f"Completing session {session_id} for user {current_user.id}")

    # Get session
    session = db.query(RoutineSession).filter(
        and_(
            RoutineSession.id == session_id,
            RoutineSession.user_id == current_user.id
        )
    ).first()

    if not session:
        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )

    if session.completed:
        raise HTTPException(
            status_code=400,
            detail="Session already completed"
        )

    # Update session
    session.completed = True
    session.completed_at = datetime.utcnow()
    session.total_duration = completion_data.total_duration

    db.commit()
    db.refresh(session)

    logger.info(f"Session {session_id} completed: {completion_data.total_duration}s")
    return session


@router.get("/me", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive statistics for the current user.

    Returns:
    - Total routines completed
    - Total time spent (in seconds)
    - Current streak (consecutive days with at least one completed routine)
    - Longest streak
    - Grade (Bronze, Silver, Gold, Platinum, Diamond, Legend)
    """
    logger.info(f"Getting stats for user {current_user.id}")

    # Count completed routines
    total_completed = db.query(func.count(RoutineSession.id)).filter(
        and_(
            RoutineSession.user_id == current_user.id,
            RoutineSession.completed == True
        )
    ).scalar() or 0

    # Sum total time
    total_time = db.query(func.sum(RoutineSession.total_duration)).filter(
        and_(
            RoutineSession.user_id == current_user.id,
            RoutineSession.completed == True,
            RoutineSession.total_duration.isnot(None)
        )
    ).scalar() or 0

    # Calculate streaks
    current_streak, longest_streak = calculate_streak(db, current_user.id)

    # Calculate grade based on longest streak (not current streak)
    grade = calculate_grade(total_completed, longest_streak, total_time)

    logger.info(f"User {current_user.id} stats: {total_completed} completed, {current_streak} streak, {total_time}s time, {grade} grade")

    return UserStatsResponse(
        total_routines_completed=total_completed,
        total_time_seconds=total_time,
        current_streak=current_streak,
        longest_streak=longest_streak,
        grade=grade
    )


@router.get("/chart-data", response_model=ChartDataResponse)
async def get_chart_data(
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db)
):
    """
    Get data for charts and visualizations.

    Returns:
    - Routines completed per day (last 30 days)
    - Total duration per day (last 30 days)
    """
    logger.info(f"Getting chart data for user {current_user.id}")

    # Get last 30 days of data
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # Get all completed sessions in last 30 days
    sessions = db.query(RoutineSession).filter(
        and_(
            RoutineSession.user_id == current_user.id,
            RoutineSession.completed == True,
            RoutineSession.completed_at >= thirty_days_ago
        )
    ).all()

    # Group by date
    data_by_date = {}
    for session in sessions:
        if session.completed_at:
            date_str = session.completed_at.date().isoformat()
            if date_str not in data_by_date:
                data_by_date[date_str] = {
                    "count": 0,
                    "duration": 0
                }
            data_by_date[date_str]["count"] += 1
            data_by_date[date_str]["duration"] += session.total_duration or 0

    # Create array of last 30 days with data
    chart_data = []
    for i in range(30):
        date = (datetime.utcnow() - timedelta(days=29 - i)).date()
        date_str = date.isoformat()

        chart_data.append(ChartDataPoint(
            date=date_str,
            count=data_by_date.get(date_str, {}).get("count", 0),
            duration=data_by_date.get(date_str, {}).get("duration", 0)
        ))

    return ChartDataResponse(
        routines_by_day=chart_data,
        last_30_days=chart_data  # Same data for now, can be different aggregations later
    )


@router.get("/sessions/recent")
async def get_recent_sessions(
    limit: int = 10,
    current_user: User = Depends(require_premium),
    db: Session = Depends(get_db)
):
    """
    Get recent sessions for the current user.

    Optional query parameter:
    - limit: Number of sessions to return (default 10)
    """
    logger.info(f"Getting recent sessions for user {current_user.id}")

    sessions = db.query(RoutineSession).filter(
        RoutineSession.user_id == current_user.id
    ).order_by(
        RoutineSession.created_at.desc()
    ).limit(limit).all()

    return sessions
