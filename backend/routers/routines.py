from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import (
    Routine,
    RoutineStep,
    RoutineCreate,
    RoutineResponse,
    RoutineUpdate
)

router = APIRouter()


@router.get("/", response_model=List[RoutineResponse])
def get_all_routines(db: Session = Depends(get_db)):
    """
    Retrieve all routines with their steps
    """
    routines = db.query(Routine).all()
    return routines


@router.get("/{routine_id}", response_model=RoutineResponse)
def get_routine_by_id(routine_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific routine by ID

    Raises:
        404: Routine not found
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine with id {routine_id} not found"
        )

    return routine


@router.post("/", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
def create_routine(routine_data: RoutineCreate, db: Session = Depends(get_db)):
    """
    Create a new routine with its steps

    Raises:
        422: Validation error (handled automatically by FastAPI/Pydantic)
    """
    # Create routine
    new_routine = Routine(nom=routine_data.nom)
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
    db: Session = Depends(get_db)
):
    """
    Update an existing routine and/or its steps

    Raises:
        404: Routine not found
        422: Validation error
    """
    # Find routine
    routine = db.query(Routine).filter(Routine.id == routine_id).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine with id {routine_id} not found"
        )

    # Update routine name if provided
    if routine_data.nom is not None:
        routine.nom = routine_data.nom

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
def delete_routine(routine_id: int, db: Session = Depends(get_db)):
    """
    Delete a routine and all its steps (cascade)

    Raises:
        404: Routine not found
    """
    routine = db.query(Routine).filter(Routine.id == routine_id).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine with id {routine_id} not found"
        )

    db.delete(routine)
    db.commit()

    return None
