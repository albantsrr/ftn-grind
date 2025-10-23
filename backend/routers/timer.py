from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Routine, RoutineStep, User
from auth import get_current_active_user
import asyncio
from datetime import datetime
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/start-routine/{routine_id}")
async def start_routine(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict:
    """
    Start executing a routine with timed steps (only if it belongs to the current user)

    This endpoint will:
    1. Fetch the routine and its steps
    2. Sequence through each step with asyncio.sleep()
    3. Log progress
    4. Return execution summary

    Raises:
        404: Routine not found or doesn't belong to user
    """
    # Fetch routine with steps that belongs to the current user
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Routine with id {routine_id} not found"
        )

    if not routine.steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Routine {routine_id} has no steps"
        )

    # Sort steps by order
    steps = sorted(routine.steps, key=lambda s: s.order)

    # Execution log
    execution_log: List[Dict] = []
    start_time = datetime.now()

    logger.info(f"Starting routine: {routine.nom} (ID: {routine_id})")
    logger.info(f"Total steps: {len(steps)}")

    # Execute each step sequentially
    for index, step in enumerate(steps, start=1):
        step_start = datetime.now()

        logger.info(f"Step {index}/{len(steps)}: {step.nom}")
        logger.info(f"  Map Code: {step.code_map}")
        logger.info(f"  Duration: {step.duree}s")
        if step.tips:
            logger.info(f"  Tips: {step.tips}")

        # Log step info
        step_info = {
            "step_number": index,
            "step_id": step.id,
            "nom": step.nom,
            "code_map": step.code_map,
            "duree": step.duree,
            "tips": step.tips,
            "started_at": step_start.isoformat()
        }

        # Wait for step duration (simulate timer)
        await asyncio.sleep(step.duree)

        step_end = datetime.now()
        step_info["completed_at"] = step_end.isoformat()
        step_info["actual_duration"] = (step_end - step_start).total_seconds()

        execution_log.append(step_info)

        logger.info(f"  ✓ Step {index} completed")

    end_time = datetime.now()
    total_duration = (end_time - start_time).total_seconds()

    logger.info(f"Routine completed! Total time: {total_duration}s")

    # Return execution summary
    return {
        "routine_id": routine_id,
        "routine_name": routine.nom,
        "status": "completed",
        "started_at": start_time.isoformat(),
        "completed_at": end_time.isoformat(),
        "total_duration_seconds": total_duration,
        "total_steps": len(steps),
        "execution_log": execution_log
    }


@router.get("/routine-preview/{routine_id}")
async def preview_routine(
    routine_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict:
    """
    Preview a routine's total duration and steps without executing it (only if it belongs to the current user)

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

    steps = sorted(routine.steps, key=lambda s: s.order)
    total_duration = sum(step.duree for step in steps)

    return {
        "routine_id": routine_id,
        "routine_name": routine.nom,
        "total_steps": len(steps),
        "total_duration_seconds": total_duration,
        "total_duration_formatted": f"{total_duration // 60}m {total_duration % 60}s",
        "steps_preview": [
            {
                "order": index + 1,
                "nom": step.nom,
                "code_map": step.code_map,
                "duree": step.duree,
                "tips": step.tips
            }
            for index, step in enumerate(steps)
        ]
    }
