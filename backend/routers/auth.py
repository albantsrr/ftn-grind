from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models import User, UserCreate, UserResponse, Token, AvatarUpdate
from auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_user_by_email,
    get_user_by_username,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    verify_password
)
from email_utils import (
    generate_token,
    generate_reset_token_expiry,
    send_verification_email,
    send_password_reset_email,
    is_token_expired
)
from pydantic import BaseModel, EmailStr
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for request bodies
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user

    Args:
        user: User creation data (email, password, optional full_name)

    Returns:
        Created user data (without password)

    Raises:
        400: Email already registered
    """
    logger.info(f"Registration attempt for email: {user.email}")

    # Check if email already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        logger.warning(f"Registration failed: email {user.email} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        logger.warning(f"Registration failed: username {user.username} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    hashed_password = get_password_hash(user.password)
    verification_token = generate_token()

    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        verification_token=verification_token,
        is_verified=False  # Email not verified yet
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send verification email
    try:
        send_verification_email(db_user.email, db_user.username, verification_token)
        logger.info(f"Verification email sent to: {db_user.email}")
    except Exception as e:
        logger.error(f"Failed to send verification email: {e}")
        # Don't fail registration if email fails

    # Create access token for auto-login after registration
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )

    logger.info(f"User registered successfully: {user.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with email and password

    Args:
        form_data: OAuth2 form with username (email) and password

    Returns:
        JWT access token

    Raises:
        401: Invalid credentials
    """
    logger.info(f"Login attempt for email: {form_data.username}")

    # Authenticate user
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Login failed: invalid credentials for {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    logger.info(f"User logged in successfully: {user.email}")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information

    Requires authentication (Bearer token)

    Returns:
        Current user data
    """
    logger.info(f"User info requested: {current_user.email}")
    return current_user


@router.get("/verify")
async def verify_token(current_user: User = Depends(get_current_active_user)):
    """
    Verify if a token is valid

    Requires authentication (Bearer token)

    Returns:
        Verification status and user email
    """
    return {
        "valid": True,
        "email": current_user.email,
        "user_id": current_user.id
    }


@router.post("/verify-email")
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verify user's email address using the token from the verification email.

    Args:
        request: Contains the verification token

    Returns:
        Success message

    Raises:
        400: Invalid or expired token
    """
    logger.info(f"Email verification attempt with token: {request.token[:10]}...")

    # Find user with this verification token
    user = db.query(User).filter(User.verification_token == request.token).first()

    if not user:
        logger.warning(f"Invalid verification token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    if user.is_verified:
        logger.info(f"Email already verified for user: {user.email}")
        return {"message": "Email already verified"}

    # Mark email as verified
    user.is_verified = True
    user.verification_token = None  # Clear the token
    db.commit()

    logger.info(f"Email verified successfully for user: {user.email}")
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
def resend_verification_email(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Resend verification email to current user.

    Requires authentication (Bearer token)

    Returns:
        Success message

    Raises:
        400: Email already verified
    """
    logger.info(f"Resend verification email requested for: {current_user.email}")

    if current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )

    # Generate new token
    new_token = generate_token()
    current_user.verification_token = new_token
    db.commit()

    # Send verification email
    try:
        send_verification_email(current_user.email, current_user.username, new_token)
        logger.info(f"Verification email resent to: {current_user.email}")
    except Exception as e:
        logger.error(f"Failed to resend verification email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )

    return {"message": "Verification email sent"}


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Request a password reset link.
    Sends an email with a reset token.

    Args:
        request: Contains the user's email

    Returns:
        Success message (always returns success even if email doesn't exist for security)
    """
    logger.info(f"Password reset requested for email: {request.email}")

    # Find user by email
    user = get_user_by_email(db, email=request.email)

    if user:
        # Generate reset token and expiry
        reset_token = generate_token()
        reset_expires = generate_reset_token_expiry()

        user.reset_token = reset_token
        user.reset_token_expires = reset_expires
        db.commit()

        # Send password reset email
        try:
            send_password_reset_email(user.email, user.username, reset_token)
            logger.info(f"Password reset email sent to: {user.email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            # Don't fail the request if email fails
    else:
        logger.info(f"Password reset requested for non-existent email: {request.email}")
        # Don't reveal that email doesn't exist for security reasons

    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using the token from the reset email.

    Args:
        request: Contains the reset token and new password

    Returns:
        Success message

    Raises:
        400: Invalid or expired token
    """
    logger.info(f"Password reset attempt with token: {request.token[:10]}...")

    # Find user with this reset token
    user = db.query(User).filter(User.reset_token == request.token).first()

    if not user:
        logger.warning(f"Invalid reset token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Check if token is expired
    if is_token_expired(user.reset_token_expires):
        logger.warning(f"Expired reset token for user: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new one."
        )

    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    user.reset_token = None  # Clear the token
    user.reset_token_expires = None  # Clear the expiry
    db.commit()

    logger.info(f"Password reset successfully for user: {user.email}")
    return {"message": "Password reset successfully"}


@router.put("/update-profile", response_model=UserResponse)
def update_profile(
    updates: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile information.

    Requires authentication (Bearer token)

    Args:
        updates: Dictionary with fields to update (username, email, full_name)

    Returns:
        Updated user data

    Raises:
        400: Email or username already taken
    """
    logger.info(f"Profile update requested for user: {current_user.email}")

    # Check if username is being changed and if it's already taken
    if "username" in updates and updates["username"] != current_user.username:
        existing_user = get_user_by_username(db, username=updates["username"])
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = updates["username"]

    # Check if email is being changed and if it's already taken
    if "email" in updates and updates["email"] != current_user.email:
        existing_user = get_user_by_email(db, email=updates["email"])
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = updates["email"]
        # Reset verification status if email is changed
        current_user.is_verified = False
        verification_token = generate_token()
        current_user.verification_token = verification_token

        # Send new verification email
        try:
            send_verification_email(current_user.email, current_user.username, verification_token)
            logger.info(f"Verification email sent to new address: {current_user.email}")
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")

    # Update full_name
    if "full_name" in updates:
        current_user.full_name = updates["full_name"]

    db.commit()
    db.refresh(current_user)

    logger.info(f"Profile updated successfully for user: {current_user.email}")
    return current_user


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password (requires current password).

    Requires authentication (Bearer token)

    Args:
        request: Contains current and new passwords

    Returns:
        Success message

    Raises:
        400: Current password is incorrect
    """
    logger.info(f"Password change requested for user: {current_user.email}")

    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        logger.warning(f"Password change failed: incorrect current password for {current_user.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()

    logger.info(f"Password changed successfully for user: {current_user.email}")
    return {"message": "Password changed successfully"}


@router.post("/update-avatar", response_model=UserResponse)
def update_avatar(
    avatar_data: AvatarUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update user's avatar (base64 image data)

    Args:
        avatar_data: Avatar update data (base64 encoded image)
        current_user: Current authenticated user
        db: Database session

    Returns:
        Updated user information
    """
    logger.info(f"Avatar update requested for user: {current_user.email}")

    # Validate base64 format (basic check)
    if not avatar_data.avatar_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar data cannot be empty"
        )

    # Update avatar
    current_user.avatar_url = avatar_data.avatar_url
    db.commit()
    db.refresh(current_user)

    logger.info(f"Avatar updated successfully for user: {current_user.email}")
    return current_user
