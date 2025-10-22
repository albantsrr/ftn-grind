from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

# SQLAlchemy ORM Models

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    sound_type = Column(String, default="beep")  # Type of sound: beep, bell, chime, notification
    volume = Column(Integer, default=30)  # Volume 0-100
    image_url = Column(String, default="/default_image.jpg")  # Image URL/path for the routine

    # Relationship with steps
    steps = relationship("RoutineStep", back_populates="routine", cascade="all, delete-orphan")


class RoutineStep(Base):
    __tablename__ = "routine_steps"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False)
    nom = Column(String, nullable=False)
    code_map = Column(String, nullable=False)
    duree = Column(Integer, nullable=False)  # Duration in seconds
    tips = Column(String, nullable=True)
    order = Column(Integer, nullable=False)  # Order of step in routine

    # Relationship with routine
    routine = relationship("Routine", back_populates="steps")


# Pydantic Models for API validation

class RoutineStepBase(BaseModel):
    nom: str
    code_map: str
    duree: int
    tips: Optional[str] = None


class RoutineStepCreate(RoutineStepBase):
    pass


class RoutineStepResponse(RoutineStepBase):
    id: int
    routine_id: int
    order: int

    model_config = ConfigDict(from_attributes=True)


class RoutineBase(BaseModel):
    nom: str
    sound_type: Optional[str] = "beep"
    volume: Optional[int] = 30
    image_url: Optional[str] = "/default_image.jpg"


class RoutineCreate(RoutineBase):
    steps: List[RoutineStepCreate]


class RoutineResponse(RoutineBase):
    id: int
    date: datetime
    steps: List[RoutineStepResponse]

    model_config = ConfigDict(from_attributes=True)


class RoutineUpdate(BaseModel):
    nom: Optional[str] = None
    steps: Optional[List[RoutineStepCreate]] = None
    sound_type: Optional[str] = None
    volume: Optional[int] = None
    image_url: Optional[str] = None
