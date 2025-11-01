from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Table, Float, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import List, Optional
import enum

# SQLAlchemy ORM Models

# Association table for many-to-many relationship between Routine and Tag
routine_tags = Table(
    'routine_tags',
    Base.metadata,
    Column('routine_id', Integer, ForeignKey('routines.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class SubscriptionTier(str, enum.Enum):
    free = "free"
    premium = "premium"


class SubscriptionStatus(str, enum.Enum):
    free = "free"
    active = "active"
    canceled = "canceled"
    past_due = "past_due"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(Text, nullable=True)  # Avatar URL or base64 data
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Email verification status
    verification_token = Column(String, nullable=True)  # Token for email verification
    reset_token = Column(String, nullable=True)  # Token for password reset
    reset_token_expires = Column(DateTime, nullable=True)  # Expiration for reset token
    subscription_tier = Column(Enum(SubscriptionTier), default=SubscriptionTier.free)  # 'free' or 'premium'
    trial_ends_at = Column(DateTime, nullable=True)  # For future trial functionality
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship with routines (one user has many routines)
    routines = relationship("Routine", back_populates="user", cascade="all, delete-orphan")
    # Relationship with subscription
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    # Relationship with routine sessions
    routine_sessions = relationship("RoutineSession", back_populates="user", cascade="all, delete-orphan")

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


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    stripe_customer_id = Column(String, unique=True, nullable=True, index=True)
    stripe_subscription_id = Column(String, unique=True, nullable=True, index=True)
    subscription_status = Column(String, default="free", nullable=False)  # free, active, canceled, past_due
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship with user
    user = relationship("User", back_populates="subscription")


class RoutineSession(Base):
    __tablename__ = "routine_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    total_duration = Column(Integer, nullable=True)  # Duration in seconds
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="routine_sessions")
    routine = relationship("Routine")


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
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    subscription_tier: str = "free"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None


class AvatarUpdate(BaseModel):
    avatar_url: str  # Base64 encoded image or URL


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


# Subscription Pydantic Models

class SubscriptionBase(BaseModel):
    subscription_status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False


class SubscriptionResponse(SubscriptionBase):
    id: int
    user_id: int
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Routine Session Pydantic Models

class RoutineSessionCreate(BaseModel):
    routine_id: int


class RoutineSessionComplete(BaseModel):
    total_duration: int  # Duration in seconds


class RoutineSessionResponse(BaseModel):
    id: int
    user_id: int
    routine_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_duration: Optional[int] = None
    completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Statistics Pydantic Models

class UserStatsResponse(BaseModel):
    total_routines_completed: int
    total_time_seconds: int
    current_streak: int
    longest_streak: int
    grade: str  # Bronze, Silver, Gold, Platinum, Diamond, Legend

    model_config = ConfigDict(from_attributes=True)


class ChartDataPoint(BaseModel):
    date: str  # ISO date format YYYY-MM-DD
    count: int  # Number of routines completed
    duration: int  # Total duration in seconds


class ChartDataResponse(BaseModel):
    routines_by_day: List[ChartDataPoint]
    last_30_days: List[ChartDataPoint]
