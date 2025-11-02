#!/usr/bin/env python3
"""
Quick test script to verify SendGrid email configuration.
Run this to test if password reset emails are working.
"""
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from email_utils import send_password_reset_email, SENDGRID_API_KEY, USE_REAL_EMAIL, FROM_EMAIL

def test_email():
    print("=" * 80)
    print("SendGrid Email Configuration Test")
    print("=" * 80)
    print(f"USE_REAL_EMAIL: {USE_REAL_EMAIL}")
    print(f"SENDGRID_API_KEY: {'✓ Set' if SENDGRID_API_KEY else '✗ Not set'}")
    print(f"FROM_EMAIL: {FROM_EMAIL}")
    print("=" * 80)

    if not USE_REAL_EMAIL:
        print("\n⚠️  Warning: USE_REAL_EMAIL is set to false")
        print("Emails will be logged to console instead of sent via SendGrid")
        print()

    if not SENDGRID_API_KEY:
        print("\n✗ Error: SENDGRID_API_KEY is not set")
        print("Please set your SendGrid API key in the .env file")
        return False

    # Test email address (change this to your email)
    test_recipient = input("\nEnter your email address to test: ").strip()

    if not test_recipient or '@' not in test_recipient:
        print("✗ Invalid email address")
        return False

    print(f"\nSending test password reset email to: {test_recipient}")
    print("This may take a few seconds...")
    print()

    try:
        # Generate a test token
        test_token = "test_token_12345"

        # Send test email
        success = send_password_reset_email(
            email=test_recipient,
            username="TestUser",
            token=test_token
        )

        if success:
            print("\n✓ Email sent successfully!")
            if USE_REAL_EMAIL:
                print(f"✓ Check your inbox at {test_recipient}")
                print("✓ The email should arrive within 1-2 minutes")
            else:
                print("✓ Email logged to console (USE_REAL_EMAIL is false)")
            return True
        else:
            print("\n✗ Failed to send email")
            print("Check the error messages above for details")
            return False

    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n")
    success = test_email()
    print("\n" + "=" * 80)
    if success:
        print("✓ Email configuration is working!")
    else:
        print("✗ Email configuration has issues")
    print("=" * 80 + "\n")
    sys.exit(0 if success else 1)
