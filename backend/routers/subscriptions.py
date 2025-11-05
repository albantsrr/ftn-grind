from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from database import get_db
from models import User, Subscription, SubscriptionResponse
from auth import get_current_active_user
import stripe
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Configure Stripe with secret key from environment
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


@router.post("/create-checkout-session")
async def create_checkout_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe Checkout session for subscribing to Premium.

    Returns the Checkout session URL to redirect the user to Stripe's hosted payment page.
    """
    logger.info(f"Creating checkout session for user: {current_user.email}")

    try:
        # Get or create subscription record
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()

        if not subscription:
            # Create new subscription record
            subscription = Subscription(
                user_id=current_user.id,
                subscription_status="free"
            )
            db.add(subscription)
            db.commit()
            db.refresh(subscription)

        # Check if user is already premium
        if subscription.subscription_status == "active":
            logger.warning(f"User {current_user.email} already has active subscription")
            raise HTTPException(
                status_code=400,
                detail="You already have an active subscription"
            )

        # Create or get Stripe customer
        if not subscription.stripe_customer_id:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.username,
                metadata={
                    "user_id": current_user.id,
                    "username": current_user.username
                }
            )
            subscription.stripe_customer_id = customer.id
            db.commit()
            logger.info(f"Created Stripe customer: {customer.id}")
        else:
            customer = stripe.Customer.retrieve(subscription.stripe_customer_id)

        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": STRIPE_PRICE_ID,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{FRONTEND_URL}/billing?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/billing?canceled=true",
            metadata={
                "user_id": current_user.id,
                "username": current_user.username
            }
        )

        logger.info(f"Checkout session created: {checkout_session.id}")
        return {"url": checkout_session.url}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create checkout session: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create checkout session"
        )


@router.get("/portal")
async def create_portal_session(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a Stripe Customer Portal session for managing subscription.

    Allows users to:
    - Update payment method
    - Cancel subscription
    - View invoices
    """
    logger.info(f"Creating portal session for user: {current_user.email}")

    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()

        if not subscription or not subscription.stripe_customer_id:
            raise HTTPException(
                status_code=404,
                detail="No subscription found. Please subscribe first."
            )

        # Create portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=subscription.stripe_customer_id,
            return_url=f"{FRONTEND_URL}/billing",
        )

        logger.info(f"Portal session created for customer: {subscription.stripe_customer_id}")
        return {"url": portal_session.url}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create portal session: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating portal session: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create portal session"
        )


@router.get("/status", response_model=SubscriptionResponse)
async def get_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's subscription status.
    """
    logger.info(f"Getting subscription status for user: {current_user.email}")

    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id
    ).first()

    if not subscription:
        # Create default free subscription
        subscription = Subscription(
            user_id=current_user.id,
            subscription_status="free"
        )
        db.add(subscription)
        db.commit()
        db.refresh(subscription)
        logger.info(f"Created default free subscription for user: {current_user.id}")

    return subscription


@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cancel the user's subscription at the end of the billing period.

    The subscription will remain active until the current period ends,
    then automatically downgrade to free tier.
    """
    logger.info(f"Canceling subscription for user: {current_user.email}")

    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == current_user.id
        ).first()

        if not subscription or not subscription.stripe_subscription_id:
            raise HTTPException(
                status_code=404,
                detail="No active subscription found"
            )

        if subscription.subscription_status != "active":
            raise HTTPException(
                status_code=400,
                detail="Subscription is not active"
            )

        # Cancel subscription at period end (not immediately)
        stripe_subscription = stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True
        )

        # Update local database
        subscription.cancel_at_period_end = True
        db.commit()

        logger.info(f"Subscription marked for cancellation at period end for user: {current_user.id}")

        return {
            "success": True,
            "message": "Subscription will be canceled at the end of the billing period",
            "period_end": datetime.fromtimestamp(stripe_subscription["current_period_end"]).isoformat()
        }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error while canceling subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel subscription: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to cancel subscription"
        )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook endpoint to handle subscription events.

    Events handled:
    - checkout.session.completed: Activate premium subscription
    - customer.subscription.updated: Update subscription status
    - customer.subscription.deleted: Cancel subscription
    - invoice.payment_failed: Handle payment failures
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        logger.info(f"Received webhook event: {event['type']}")
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        await handle_checkout_completed(session, db)

    elif event["type"] == "customer.subscription.updated":
        subscription_data = event["data"]["object"]
        await handle_subscription_updated(subscription_data, db)

    elif event["type"] == "customer.subscription.deleted":
        subscription_data = event["data"]["object"]
        await handle_subscription_deleted(subscription_data, db)

    elif event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        await handle_payment_failed(invoice, db)

    return {"status": "success"}


# Webhook handler functions

async def handle_checkout_completed(session, db: Session):
    """Handle successful checkout completion"""
    logger.info(f"Handling checkout completed for session: {session['id']}")

    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    metadata = session.get("metadata", {})
    user_id = metadata.get("user_id")

    if not user_id:
        logger.error(f"No user_id in session metadata for session: {session['id']}")
        return

    # Convert user_id to int
    try:
        user_id = int(user_id)
    except ValueError:
        logger.error(f"Invalid user_id in metadata: {user_id}")
        return

    # Find or create subscription
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).first()

    if not subscription:
        # Create new subscription
        subscription = Subscription(
            user_id=user_id,
            stripe_customer_id=customer_id,
            subscription_status="free"
        )
        db.add(subscription)
        db.flush()
        logger.info(f"Created new subscription for user: {user_id}")
    else:
        # Update existing subscription with customer_id
        subscription.stripe_customer_id = customer_id
        logger.info(f"Updated subscription for user: {user_id}")

    # Get subscription details from Stripe
    stripe_subscription = stripe.Subscription.retrieve(subscription_id)

    # Update subscription record
    subscription.stripe_subscription_id = subscription_id
    subscription.subscription_status = "active"
    subscription.current_period_start = datetime.fromtimestamp(stripe_subscription["current_period_start"])
    subscription.current_period_end = datetime.fromtimestamp(stripe_subscription["current_period_end"])
    subscription.cancel_at_period_end = stripe_subscription["cancel_at_period_end"]

    # Update user tier to premium
    user = db.query(User).filter(User.id == subscription.user_id).first()
    if user:
        user.subscription_tier = "premium"

    db.commit()
    logger.info(f"Activated premium subscription for user: {subscription.user_id}")


async def handle_subscription_updated(subscription_data, db: Session):
    """Handle subscription updates"""
    logger.info(f"Handling subscription updated: {subscription_data['id']}")

    subscription_id = subscription_data["id"]

    # Find subscription by stripe_subscription_id
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()

    if not subscription:
        logger.error(f"Subscription not found: {subscription_id}")
        return

    # Update subscription status
    status_map = {
        "active": "active",
        "past_due": "past_due",
        "canceled": "canceled",
        "unpaid": "past_due",
        "incomplete": "free",
        "incomplete_expired": "free",
        "trialing": "active"
    }

    new_status = status_map.get(subscription_data["status"], "free")
    subscription.subscription_status = new_status
    subscription.current_period_start = datetime.fromtimestamp(subscription_data["current_period_start"])
    subscription.current_period_end = datetime.fromtimestamp(subscription_data["current_period_end"])
    subscription.cancel_at_period_end = subscription_data["cancel_at_period_end"]

    # Update user tier
    user = db.query(User).filter(User.id == subscription.user_id).first()
    if user:
        user.subscription_tier = "premium" if new_status == "active" else "free"

    db.commit()
    logger.info(f"Updated subscription status to {new_status} for user: {subscription.user_id}")


async def handle_subscription_deleted(subscription_data, db: Session):
    """Handle subscription cancellation"""
    logger.info(f"Handling subscription deleted: {subscription_data['id']}")

    subscription_id = subscription_data["id"]

    # Find subscription by stripe_subscription_id
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_id
    ).first()

    if not subscription:
        logger.error(f"Subscription not found: {subscription_id}")
        return

    # Update to free tier
    subscription.subscription_status = "canceled"
    subscription.stripe_subscription_id = None

    # Update user tier to free
    user = db.query(User).filter(User.id == subscription.user_id).first()
    if user:
        user.subscription_tier = "free"

    db.commit()
    logger.info(f"Cancelled subscription for user: {subscription.user_id}")


async def handle_payment_failed(invoice, db: Session):
    """Handle failed payment"""
    logger.info(f"Handling payment failed for invoice: {invoice['id']}")

    customer_id = invoice.get("customer")

    # Find subscription by stripe_customer_id
    subscription = db.query(Subscription).filter(
        Subscription.stripe_customer_id == customer_id
    ).first()

    if not subscription:
        logger.error(f"Subscription not found for customer: {customer_id}")
        return

    # Update status to past_due
    subscription.subscription_status = "past_due"

    # Keep user as premium but mark as past_due (grace period)
    # They will be downgraded when subscription is actually canceled

    db.commit()
    logger.info(f"Marked subscription as past_due for user: {subscription.user_id}")
