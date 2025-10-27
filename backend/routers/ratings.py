from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Routine, RoutineRating, RatingCreate, RatingResponse, RoutineRatingInfo, User
from auth import get_current_active_user

router = APIRouter()


@router.post("/routines/{routine_id}/rate", response_model=RatingResponse)
def rate_routine(
    routine_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Rate a routine (1-5 stars)
    - Users can rate any public routine except their own
    - One rating per user per routine (updates existing rating)
    - Automatically recalculates average rating

    Parameters:
    - routine_id: ID of the routine to rate
    - rating: Rating value (1-5)

    Returns:
    - Created or updated rating

    Raises:
    - 404: Routine not found or not public
    - 400: Cannot rate your own routine
    """
    # Find routine (must be public)
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.is_public == True
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public routine not found"
        )

    # Cannot rate your own routine
    if routine.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot rate your own routine"
        )

    # Check if user already rated this routine
    existing_rating = db.query(RoutineRating).filter(
        RoutineRating.routine_id == routine_id,
        RoutineRating.user_id == current_user.id
    ).first()

    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_data.rating
        db.commit()
        db.refresh(existing_rating)
        rating_record = existing_rating
    else:
        # Create new rating
        new_rating = RoutineRating(
            routine_id=routine_id,
            user_id=current_user.id,
            rating=rating_data.rating
        )
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        rating_record = new_rating

    # Recalculate average rating
    ratings = db.query(RoutineRating).filter(RoutineRating.routine_id == routine_id).all()
    if ratings:
        total = sum(r.rating for r in ratings)
        routine.average_rating = total / len(ratings)
        routine.total_ratings = len(ratings)
        db.commit()

    return rating_record


@router.get("/routines/{routine_id}/rating", response_model=RoutineRatingInfo)
def get_routine_rating(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get rating information for a routine

    Parameters:
    - routine_id: ID of the routine

    Returns:
    - Average rating, total ratings, and current user's rating (if exists)

    Raises:
    - 404: Routine not found
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found"
        )

    # Get current user's rating if exists
    user_rating_record = db.query(RoutineRating).filter(
        RoutineRating.routine_id == routine_id,
        RoutineRating.user_id == current_user.id
    ).first()

    return RoutineRatingInfo(
        average_rating=routine.average_rating,
        total_ratings=routine.total_ratings,
        user_rating=user_rating_record.rating if user_rating_record else None
    )


@router.delete("/routines/{routine_id}/rate", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete your rating for a routine

    Parameters:
    - routine_id: ID of the routine

    Raises:
    - 404: Rating not found
    """
    rating = db.query(RoutineRating).filter(
        RoutineRating.routine_id == routine_id,
        RoutineRating.user_id == current_user.id
    ).first()

    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rating not found"
        )

    db.delete(rating)
    db.commit()

    # Recalculate average rating
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if routine:
        ratings = db.query(RoutineRating).filter(RoutineRating.routine_id == routine_id).all()
        if ratings:
            total = sum(r.rating for r in ratings)
            routine.average_rating = total / len(ratings)
            routine.total_ratings = len(ratings)
        else:
            routine.average_rating = 0.0
            routine.total_ratings = 0
        db.commit()

    return None
