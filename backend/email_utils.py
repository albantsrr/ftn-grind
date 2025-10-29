"""
Email utility functions for sending verification and password reset emails.
Uses SendGrid for email delivery in production, console logging in development.
"""
import secrets
import os
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment variables
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@fortiflow.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
USE_REAL_EMAIL = os.getenv("USE_REAL_EMAIL", "false").lower() == "true"

def generate_token() -> str:
    """Generate a secure random token for email verification or password reset."""
    return secrets.token_urlsafe(32)

def generate_reset_token_expiry() -> datetime:
    """Generate expiration time for reset token (24 hours from now)."""
    return datetime.utcnow() + timedelta(hours=24)

def send_email_via_sendgrid(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send email using SendGrid API.
    Returns True if successful, False otherwise.
    """
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )

        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)

        logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

def send_verification_email(email: str, username: str, token: str) -> bool:
    """
    Send email verification link to user.
    Uses SendGrid in production, console logging in development.
    """
    verification_url = f"{FRONTEND_URL}/verify-email?token={token}"

    subject = "Verify your FortiFlow account"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌀 FortiFlow</h1>
                <p>Master your flow. Map by map.</p>
            </div>
            <div class="content">
                <h2>Hello {username}!</h2>
                <p>Welcome to FortiFlow! Please verify your email address by clicking the button below:</p>
                <p style="text-align: center;">
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </p>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-family: monospace;">
                    {verification_url}
                </p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>© 2025 FortiFlow - Alban Teissier</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Use real email service or console logging
    if USE_REAL_EMAIL and SENDGRID_API_KEY:
        return send_email_via_sendgrid(email, subject, html_content)
    else:
        # Development mode: log to console
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
    Uses SendGrid in production, console logging in development.
    """
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    subject = "Reset your FortiFlow password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌀 FortiFlow</h1>
                <p>Master your flow. Map by map.</p>
            </div>
            <div class="content">
                <h2>Hello {username}!</h2>
                <p>We received a request to reset your password. Click the button below to set a new password:</p>
                <p style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px; font-family: monospace;">
                    {reset_url}
                </p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
                <p>© 2025 FortiFlow - Alban Teissier</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Use real email service or console logging
    if USE_REAL_EMAIL and SENDGRID_API_KEY:
        return send_email_via_sendgrid(email, subject, html_content)
    else:
        # Development mode: log to console
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
