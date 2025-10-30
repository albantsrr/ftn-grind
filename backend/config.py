"""
Configuration module for FortiFlow backend.

Centralizes all environment variables, constants, and configuration settings.
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ==================== Environment Variables ====================

# Security
SECRET_KEY: str = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")

ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

# Email Configuration
USE_REAL_EMAIL: bool = os.getenv("USE_REAL_EMAIL", "false").lower() == "true"
SENDGRID_API_KEY: Optional[str] = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@fortiflow.com")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Stripe Configuration
STRIPE_SECRET_KEY: Optional[str] = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY: Optional[str] = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET: Optional[str] = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID: Optional[str] = os.getenv("STRIPE_PRICE_ID")

# Database
DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fortiflow.db")

# ==================== Application Constants ====================

# Subscription Tiers
class SubscriptionLimits:
    """Limits for different subscription tiers"""
    FREE_MAX_ROUTINES: int = 2
    PREMIUM_MAX_ROUTINES: int = -1  # Unlimited (-1)

    # Token expiration
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24

# Community & Pagination
class CommunitySettings:
    """Settings for community features"""
    DEFAULT_PAGE_SIZE: int = 12
    MAX_PAGE_SIZE: int = 50
    SEARCH_MIN_LENGTH: int = 2

# Rating System
class RatingSettings:
    """Settings for rating system"""
    MIN_RATING: int = 1
    MAX_RATING: int = 5

# Default Tags
DEFAULT_TAGS = [
    {"nom": "Aim Training", "color": "#EF4444"},  # Red
    {"nom": "Building", "color": "#F59E0B"},      # Orange
    {"nom": "Edit Course", "color": "#10B981"},   # Green
    {"nom": "Box Fight", "color": "#3B82F6"},     # Blue
    {"nom": "Zone Wars", "color": "#8B5CF6"},     # Purple
    {"nom": "Warm-up", "color": "#EC4899"},       # Pink
    {"nom": "Advanced", "color": "#6366F1"},      # Indigo
    {"nom": "Beginner", "color": "#14B8A6"},      # Teal
]

# Grade System Requirements
class GradeRequirements:
    """
    Requirements for each grade level.
    Each grade requires: routines completed, streak days, and total time (in hours).
    """
    BRONZE = {"routines": 10, "streak": 5, "time_hours": 1}
    SILVER = {"routines": 50, "streak": 15, "time_hours": 5}
    GOLD = {"routines": 150, "streak": 30, "time_hours": 15}
    PLATINUM = {"routines": 300, "streak": 60, "time_hours": 30}
    DIAMOND = {"routines": 600, "streak": 120, "time_hours": 60}
    LEGEND = {"routines": 1000, "streak": 200, "time_hours": 100}
