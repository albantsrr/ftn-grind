from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Tag, TagCreate, TagResponse, Routine, User
from auth import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[TagResponse])
def get_all_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve all available tags

    Returns:
    - List of all tags with their colors
    """
    tags = db.query(Tag).order_by(Tag.nom).all()
    return tags


@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new tag

    Parameters:
    - nom: Tag name (must be unique)
    - color: Hex color code (optional, default: #8B5CF6)

    Returns:
    - Created tag

    Raises:
    - 400: Tag with this name already exists
    """
    # Check if tag already exists
    existing_tag = db.query(Tag).filter(Tag.nom == tag_data.nom).first()
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag '{tag_data.nom}' already exists"
        )

    # Create new tag
    new_tag = Tag(
        nom=tag_data.nom,
        color=tag_data.color
    )
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)

    return new_tag


@router.post("/routines/{routine_id}/tags", response_model=TagResponse)
def add_tag_to_routine(
    routine_id: int,
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Add a tag to a routine (creates tag if it doesn't exist)
    Only the owner can add tags to their routine

    Parameters:
    - routine_id: ID of the routine
    - tag_data: Tag name and color

    Returns:
    - The tag that was added

    Raises:
    - 404: Routine not found or doesn't belong to user
    - 400: Tag already associated with this routine
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

    # Find or create tag
    tag = db.query(Tag).filter(Tag.nom == tag_data.nom).first()
    if not tag:
        tag = Tag(nom=tag_data.nom, color=tag_data.color)
        db.add(tag)
        db.flush()

    # Check if tag is already associated with routine
    if tag in routine.tags:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag '{tag.nom}' is already associated with this routine"
        )

    # Add tag to routine
    routine.tags.append(tag)
    db.commit()
    db.refresh(tag)

    return tag


@router.delete("/routines/{routine_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_tag_from_routine(
    routine_id: int,
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Remove a tag from a routine
    Only the owner can remove tags from their routine

    Parameters:
    - routine_id: ID of the routine
    - tag_id: ID of the tag to remove

    Raises:
    - 404: Routine or tag not found, or doesn't belong to user
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

    # Find tag
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )

    # Remove tag from routine if it's associated
    if tag in routine.tags:
        routine.tags.remove(tag)
        db.commit()

    return None
