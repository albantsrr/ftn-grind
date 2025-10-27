"""
Email utility functions for sending verification and password reset emails.
In development mode, emails are logged to console instead of being sent.
"""
import secrets
from datetime import datetime, timedelta
from typing import Optional

def generate_token() -> str:
    """Generate a secure random token for email verification or password reset."""
    return secrets.token_urlsafe(32)

def generate_reset_token_expiry() -> datetime:
    """Generate expiration time for reset token (24 hours from now)."""
    return datetime.utcnow() + timedelta(hours=24)

def send_verification_email(email: str, username: str, token: str) -> bool:
    """
    Send email verification link to user.
    In production, this would use an email service (SendGrid, AWS SES, etc.)
    For now, we log to console for development.
    """
    verification_url = f"http://localhost:5173/verify-email?token={token}"

    print("=" * 80)
    print("📧 EMAIL VERIFICATION")
    print("=" * 80)
    print(f"To: {email}")
    print(f"Subject: Verify your FortiFlow account")
    print("-" * 80)
    print(f"Hello {username},")
    print()
    print("Welcome to FortiFlow! Please verify your email address by clicking the link below:")
    print()
    print(f"🔗 {verification_url}")
    print()
    print("This link will expire in 24 hours.")
    print()
    print("If you didn't create this account, please ignore this email.")
    print("=" * 80)
    print()

    return True

def send_password_reset_email(email: str, username: str, token: str) -> bool:
    """
    Send password reset link to user.
    In production, this would use an email service.
    For now, we log to console for development.
    """
    reset_url = f"http://localhost:5173/reset-password?token={token}"

    print("=" * 80)
    print("🔐 PASSWORD RESET")
    print("=" * 80)
    print(f"To: {email}")
    print(f"Subject: Reset your FortiFlow password")
    print("-" * 80)
    print(f"Hello {username},")
    print()
    print("We received a request to reset your password. Click the link below to set a new password:")
    print()
    print(f"🔗 {reset_url}")
    print()
    print("This link will expire in 24 hours.")
    print()
    print("If you didn't request a password reset, please ignore this email. Your password will remain unchanged.")
    print("=" * 80)
    print()

    return True

def is_token_expired(expires_at: Optional[datetime]) -> bool:
    """Check if a token has expired."""
    if not expires_at:
        return True
    return datetime.utcnow() > expires_at
