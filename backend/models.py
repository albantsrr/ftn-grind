from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Table, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import List, Optional

# SQLAlchemy ORM Models

# Association table for many-to-many relationship between Routine and Tag
routine_tags = Table(
    'routine_tags',
    Base.metadata,
    Column('routine_id', Integer, ForeignKey('routines.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship with routines (one user has many routines)
    routines = relationship("Routine", back_populates="user", cascade="all, delete-orphan")

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    nom = Column(String, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    sound_type = Column(String, default="beep")  # Type of sound: beep, bell, chime, notification
    volume = Column(Integer, default=30)  # Volume 0-100
    image_url = Column(Text, default="/default_image.jpg")  # Image URL/path or base64 data for the routine
    is_public = Column(Boolean, default=False, index=True)  # Public routines visible in community
    author_name = Column(String, nullable=True)  # Display name of the creator
    average_rating = Column(Float, default=0.0)  # Average rating (0-5)
    total_ratings = Column(Integer, default=0)  # Total number of ratings

    # Relationship with user
    user = relationship("User", back_populates="routines")

    # Relationship with steps
    steps = relationship("RoutineStep", back_populates="routine", cascade="all, delete-orphan")

    # Relationship with tags (many-to-many)
    tags = relationship("Tag", secondary=routine_tags, back_populates="routines")

    # Relationship with ratings
    ratings = relationship("RoutineRating", back_populates="routine", cascade="all, delete-orphan")


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


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, unique=True, nullable=False, index=True)  # Tag name (e.g., "Aim Training", "Building", "Edit Course")
    color = Column(String, default="#8B5CF6")  # Hex color for display (default purple)

    # Relationship with routines (many-to-many)
    routines = relationship("Routine", secondary=routine_tags, back_populates="tags")


class RoutineRating(Base):
    __tablename__ = "routine_ratings"
    __table_args__ = (
        UniqueConstraint('routine_id', 'user_id', name='unique_user_routine_rating'),
    )

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # Rating value (1-5)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    routine = relationship("Routine", back_populates="ratings")
    user = relationship("User")


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
    is_public: Optional[bool] = False
    author_name: Optional[str] = None


class RoutineCreate(RoutineBase):
    steps: List[RoutineStepCreate]


class RoutineResponse(RoutineBase):
    id: int
    date: datetime
    user_id: int
    average_rating: float = 0.0
    total_ratings: int = 0
    steps: List[RoutineStepResponse]
    tags: List["TagResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class RoutineUpdate(BaseModel):
    nom: Optional[str] = None
    steps: Optional[List[RoutineStepCreate]] = None
    sound_type: Optional[str] = None
    volume: Optional[int] = None
    image_url: Optional[str] = None
    is_public: Optional[bool] = None
    author_name: Optional[str] = None


# Authentication Pydantic Models

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None


# Tag Pydantic Models

class TagBase(BaseModel):
    nom: str
    color: Optional[str] = "#8B5CF6"


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Rating Pydantic Models

class RatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating value between 1 and 5")


class RatingResponse(BaseModel):
    id: int
    routine_id: int
    user_id: int
    rating: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoutineRatingInfo(BaseModel):
    average_rating: float
    total_ratings: int
    user_rating: Optional[int] = None  # Current user's rating if exists
