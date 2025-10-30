from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import (
    Routine,
    RoutineStep,
    RoutineCreate,
    RoutineResponse,
    RoutineUpdate,
    User
)
from auth import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[RoutineResponse])
def get_all_routines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all routines for the current user
    """
    routines = db.query(Routine).filter(Routine.user_id == current_user.id).all()
    return routines


@router.get("/{routine_id}", response_model=RoutineResponse)
def get_routine_by_id(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve a specific routine by ID (only if it belongs to the current user)

    Raises:
        404: Routine not found or doesn't belong to user
    """
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine with id {routine_id} not found"
        )

    return routine


@router.post("/", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
def create_routine(
    routine_data: RoutineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new routine with its steps for the current user

    Free tier limitation: Users with free subscription can only create up to 2 routines.
    Premium users have unlimited routines.

    Raises:
        403: Free user has reached the limit of 2 routines
        422: Validation error (handled automatically by FastAPI/Pydantic)
    """
    # Check free tier limitation
    if current_user.subscription_tier == "free":
        # Count existing routines for this user
        routine_count = db.query(Routine).filter(
            Routine.user_id == current_user.id
        ).count()

        if routine_count >= 2:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free users are limited to 2 routines. Upgrade to Premium for unlimited routines."
            )

    # Create routine with user_id
    new_routine = Routine(
        user_id=current_user.id,
        nom=routine_data.nom,
        sound_type=routine_data.sound_type,
        volume=routine_data.volume,
        image_url=routine_data.image_url,
        is_public=routine_data.is_public,
        author_name=routine_data.author_name or current_user.username
    )
    db.add(new_routine)
    db.flush()  # Get the routine ID before committing

    # Create steps with order
    for index, step_data in enumerate(routine_data.steps):
        new_step = RoutineStep(
            routine_id=new_routine.id,
            nom=step_data.nom,
            code_map=step_data.code_map,
            duree=step_data.duree,
            tips=step_data.tips,
            order=index
        )
        db.add(new_step)

    db.commit()
    db.refresh(new_routine)

    return new_routine


@router.put("/{routine_id}", response_model=RoutineResponse)
def update_routine(
    routine_id: int,
    routine_data: RoutineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing routine and/or its steps (only if it belongs to the current user)

    Raises:
        404: Routine not found or doesn't belong to user
        422: Validation error
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

    # Update routine fields if provided
    if routine_data.nom is not None:
        routine.nom = routine_data.nom
    if routine_data.sound_type is not None:
        routine.sound_type = routine_data.sound_type
    if routine_data.volume is not None:
        routine.volume = routine_data.volume
    if routine_data.image_url is not None:
        routine.image_url = routine_data.image_url
    if routine_data.is_public is not None:
        routine.is_public = routine_data.is_public
    if routine_data.author_name is not None:
        routine.author_name = routine_data.author_name

    # Update steps if provided
    if routine_data.steps is not None:
        # Delete existing steps
        db.query(RoutineStep).filter(RoutineStep.routine_id == routine_id).delete()

        # Create new steps
        for index, step_data in enumerate(routine_data.steps):
            new_step = RoutineStep(
                routine_id=routine_id,
                nom=step_data.nom,
                code_map=step_data.code_map,
                duree=step_data.duree,
                tips=step_data.tips,
                order=index
            )
            db.add(new_step)

    db.commit()
    db.refresh(routine)

    return routine


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a routine and all its steps (cascade) - only if it belongs to the current user

    Raises:
        404: Routine not found or doesn't belong to user
    """
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine with id {routine_id} not found"
        )

    db.delete(routine)
    db.commit()

    return None
