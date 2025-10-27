from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_
from typing import List, Optional
from database import get_db
from models import Routine, RoutineResponse, User, Tag
from auth import get_current_active_user

router = APIRouter()


@router.get("/routines", response_model=List[RoutineResponse])
def get_public_routines(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of records to return"),
    sort_by: str = Query("date", description="Sort by: date, nom, rating"),
    search: Optional[str] = Query(None, description="Search in routine name"),
    author: Optional[str] = Query(None, description="Filter by author name"),
    tags: Optional[str] = Query(None, description="Comma-separated tag IDs to filter by"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all public routines from the community with advanced search and filtering

    Parameters:
    - skip: Pagination offset
    - limit: Maximum number of results (max 100)
    - sort_by: Sort field (date, nom, or rating)
    - search: Search query for routine name (case-insensitive)
    - author: Filter by author name (case-insensitive)
    - tags: Comma-separated tag IDs (e.g., "1,2,3") - returns routines with ANY of these tags

    Returns:
    - List of public routines with their steps and tags
    """
    query = db.query(Routine).filter(Routine.is_public == True)

    # Apply search filter (search in routine name)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(Routine.nom.ilike(search_pattern))

    # Apply author filter
    if author:
        author_pattern = f"%{author}%"
        query = query.filter(Routine.author_name.ilike(author_pattern))

    # Apply tags filter (routines that have ANY of the specified tags)
    if tags:
        try:
            tag_ids = [int(tag_id.strip()) for tag_id in tags.split(",") if tag_id.strip()]
            if tag_ids:
                # Join with tags and filter by tag IDs
                query = query.join(Routine.tags).filter(Tag.id.in_(tag_ids)).distinct()
        except ValueError:
            # Invalid tag IDs format, ignore filter
            pass

    # Apply sorting
    if sort_by == "nom":
        query = query.order_by(Routine.nom)
    elif sort_by == "rating":
        query = query.order_by(desc(Routine.average_rating), desc(Routine.total_ratings))
    else:  # Default to date (most recent first)
        query = query.order_by(desc(Routine.date))

    # Apply pagination
    routines = query.offset(skip).limit(limit).all()

    return routines


@router.post("/routines/{routine_id}/share", response_model=RoutineResponse)
def toggle_routine_share(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Toggle a routine's public/private status (share/unshare)
    Only the owner can share/unshare their routine

    Parameters:
    - routine_id: ID of the routine to share/unshare

    Returns:
    - Updated routine with new is_public status

    Raises:
    - 404: Routine not found or doesn't belong to user
    """
    # Find routine that belongs to the current user
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine with id {routine_id} not found"
        )

    # Toggle the is_public status
    routine.is_public = not routine.is_public

    # Ensure author_name is set when sharing
    if routine.is_public and not routine.author_name:
        routine.author_name = current_user.username

    db.commit()
    db.refresh(routine)

    return routine
