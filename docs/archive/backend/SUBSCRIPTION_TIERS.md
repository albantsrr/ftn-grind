# FortiFlow Subscription Tiers

This document describes the features available for each subscription tier.

## Overview

FortiFlow offers two subscription tiers:
- **Free**: Limited features for trying out the app
- **Premium**: Full access to all features (3.99€/month)

---

## Feature Comparison

| Feature | Free | Premium |
|---------|------|---------|
| **Routines** | ✅ Up to 2 routines | ✅ Unlimited routines |
| **Routine Execution** | ✅ Unlimited | ✅ Unlimited |
| **Timer & Alerts** | ✅ Yes | ✅ Yes |
| **Session Tracking** | ✅ Yes (tracked but not viewable) | ✅ Yes |
| **Community Access** | ❌ No | ✅ Full access |
| **Share Routines** | ❌ No | ✅ Yes |
| **Statistics Page** | ❌ No | ✅ Full access |
| **Grades & Streaks** | ❌ No | ✅ Yes |
| **Charts & Analytics** | ❌ No | ✅ Yes |

---

## Free Tier

### ✅ What's Included

**Routine Management:**
- Create up to **2 routines**
- Edit your routines
- Delete your routines
- Full access to routine steps (unlimited steps per routine)

**Routine Execution:**
- Execute any of your routines with the timer
- Sound alerts and instructions
- Auto-play feature

**Session Tracking:**
- Sessions are tracked automatically (for future statistics when upgraded)
- Duration and completion are recorded

### ❌ Limitations

**Routine Creation:**
- Limited to **2 routines maximum**
- Attempting to create a 3rd routine returns `403 Forbidden` error:
  ```json
  {
    "detail": "Free users are limited to 2 routines. Upgrade to Premium for unlimited routines."
  }
  ```

**Community Features:**
- Cannot access `/api/community/routines` (browse public routines)
- Cannot share routines publicly
- Attempting access returns `403 Forbidden` error:
  ```json
  {
    "detail": "Premium subscription required. Upgrade to access this feature."
  }
  ```

**Statistics:**
- Cannot access `/api/statistics/me` (view stats)
- Cannot access `/api/statistics/chart-data` (view charts)
- Cannot access `/api/statistics/sessions/recent` (view history)
- Sessions are still tracked for when user upgrades

---

## Premium Tier (3.99€/month)

### ✅ What's Included

**Everything from Free, plus:**

**Unlimited Routines:**
- Create unlimited routines
- No restrictions on routine creation

**Community Access:**
- Browse all public routines from other users
- Search and filter routines by name, author, tags
- Rate routines (1-5 stars)
- Import routines from the community

**Share Your Routines:**
- Make your routines public
- Share with the community
- Build your reputation

**Statistics & Analytics:**
- Comprehensive stats dashboard
  - Total routines completed
  - Total time spent training
  - Current streak (consecutive days)
  - Longest streak
  - Grade system (Bronze → Legend)
- Visual charts and graphs
  - Routines per day (last 30 days)
  - Time spent per day
  - Activity calendar
- Session history

**Grades System:**
Progress through ranks based on your activity:
- 🥉 **Bronze**: 5 routines + 3 days streak
- 🥈 **Silver**: 20 routines + 7 days streak
- 🥇 **Gold**: 50 routines + 15 days streak
- 💎 **Platinum**: 100 routines + 30 days streak
- 💠 **Diamond**: 250 routines + 60 days streak
- 🏆 **Legend**: 500 routines + 100 days streak

---

## API Endpoints by Tier

### Free Tier Endpoints

✅ **Accessible:**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
GET    /api/routines/                (own routines only)
POST   /api/routines/                (max 2 routines)
PUT    /api/routines/{id}
DELETE /api/routines/{id}
POST   /api/timer/start-routine/{id}
GET    /api/timer/routine-preview/{id}
POST   /api/statistics/session/start        (tracked but not viewable)
POST   /api/statistics/session/{id}/complete (tracked but not viewable)
GET    /api/subscriptions/status
POST   /api/subscriptions/create-checkout-session
```

❌ **Restricted (403 Forbidden):**
```
GET    /api/community/routines        → Premium required
POST   /api/community/routines/{id}/share → Premium required
GET    /api/statistics/me             → Premium required
GET    /api/statistics/chart-data     → Premium required
GET    /api/statistics/sessions/recent → Premium required
```

### Premium Tier Endpoints

✅ **All endpoints accessible** including:
```
GET    /api/community/routines
POST   /api/community/routines/{id}/share
GET    /api/statistics/me
GET    /api/statistics/chart-data
GET    /api/statistics/sessions/recent
POST   /api/routines/                 (unlimited)
```

---

## Upgrading to Premium

### How to Upgrade

1. **Via API:**
   ```bash
   POST /api/subscriptions/create-checkout-session
   ```
   - Returns a Stripe Checkout URL
   - Redirect user to complete payment

2. **Payment Flow:**
   - User is redirected to Stripe Checkout (hosted)
   - Enters payment details (card info)
   - Completes payment
   - Stripe webhook notifies backend
   - User is automatically upgraded to Premium

3. **Instant Activation:**
   - Upgrade is immediate after payment
   - `user.subscription_tier` changes from "free" to "premium"
   - All Premium features unlock instantly

### Managing Subscription

Users can manage their subscription via Stripe Customer Portal:

```bash
GET /api/subscriptions/portal
```

This allows users to:
- Update payment method
- Cancel subscription
- View invoices
- Download receipts

---

## Downgrading from Premium

### What Happens When Subscription Ends

When a Premium subscription is canceled or expires:

1. **User Tier Changes:**
   - `user.subscription_tier` changes from "premium" to "free"
   - `subscription.subscription_status` changes to "canceled"

2. **Routine Access:**
   - User keeps access to **all existing routines** (read-only)
   - User can **execute** all existing routines
   - User **cannot create new routines** if they already have 2+
   - Example: User has 10 routines → keeps all 10 but cannot create an 11th

3. **Community Access:**
   - Loses access to browse community
   - Previously shared routines **remain public**
   - Cannot share new routines

4. **Statistics:**
   - Loses access to statistics dashboard
   - Session tracking continues in background
   - Data is preserved for if/when user upgrades again

### Grace Period

- Payment failures result in `subscription_status = "past_due"`
- User keeps Premium access during grace period
- After final payment failure, subscription is canceled

---

## Implementation Details

### Backend Checks

**Free Tier Limitation (max 2 routines):**
```python
# In routers/routines.py - create_routine()
if current_user.subscription_tier == "free":
    routine_count = db.query(Routine).filter(
        Routine.user_id == current_user.id
    ).count()

    if routine_count >= 2:
        raise HTTPException(
            status_code=403,
            detail="Free users are limited to 2 routines..."
        )
```

**Premium Middleware:**
```python
# In auth.py
async def require_premium(current_user: User = Depends(get_current_active_user)):
    if current_user.subscription_tier != "premium":
        raise HTTPException(
            status_code=403,
            detail="Premium subscription required..."
        )
    return current_user
```

**Applied to Routes:**
- All `/api/community/*` routes
- All `/api/statistics/*` routes (except session tracking)

---

## Testing

### Test Free Tier Limitations

1. Create a Free user (register without upgrading)
2. Create 2 routines → Should succeed
3. Try to create a 3rd routine → Should fail with 403
4. Try to access `/api/community/routines` → Should fail with 403
5. Try to access `/api/statistics/me` → Should fail with 403

### Test Premium Features

1. Upgrade user to Premium via Stripe test card
2. Create 3+ routines → Should succeed
3. Access `/api/community/routines` → Should succeed
4. Access `/api/statistics/me` → Should succeed
5. Share a routine → Should succeed

### Test Downgrade

1. Cancel Premium subscription (via Stripe portal)
2. User should retain access to all routines
3. Attempting to create new routine (if user has 2+) → Should fail with 403
4. Attempting to access Community → Should fail with 403
5. Attempting to access Statistics → Should fail with 403

---

## Frontend Implementation Notes

### UI/UX for Free Users

**Routine Creation:**
- Show routine count (e.g., "2/2 routines")
- Disable "Create Routine" button when limit reached
- Display upgrade CTA when clicking disabled button

**Community Tab:**
- Show locked icon on sidebar
- Display paywall when clicking Community
- Show Premium features preview

**Statistics Tab:**
- Show locked icon on sidebar
- Display paywall when clicking Statistics
- Show preview of what's available in Premium

### UI/UX for Premium Users

**Visual Indicators:**
- Display "⭐ Premium" badge next to username
- Remove routine count limit indicator
- Unlock all navigation items
- Enable all features

---

## Pricing

- **Premium**: 3.99 EUR / month (recurring)
- **Payment Method**: Credit/Debit card via Stripe
- **Billing**: Monthly, automatic renewal
- **Cancellation**: Anytime via Customer Portal

---

## Support

For subscription-related issues:
1. Check subscription status: `GET /api/subscriptions/status`
2. Manage subscription: `GET /api/subscriptions/portal`
3. Contact support if webhook issues occur

For technical issues:
- Check backend logs for webhook events
- Verify Stripe webhook secret is correct
- Test with Stripe test cards first
