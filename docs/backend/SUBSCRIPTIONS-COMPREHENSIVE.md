# FortiFlow Subscriptions - Comprehensive Guide

Complete guide to FortiFlow's subscription system including Stripe setup, tier features, and implementation details.

## Quick Reference

**Tiers:** Free (2 routines max) | Premium (€3.99/month - unlimited)

**Stripe Setup:**
1. Get test keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Create product with `price_` ID
3. Setup webhook with Stripe CLI: `stripe listen --forward-to http://localhost:3000/api/subscriptions/webhook`
4. Add to `backend/.env`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
5. Test with card: `4242 4242 4242 4242`

## Feature Comparison

| Feature | Free | Premium |
|---------|------|---------|
| **Routines** | ✅ Up to 2 | ✅ Unlimited |
| **Execution** | ✅ Unlimited | ✅ Unlimited |
| **Community** | ❌ No | ✅ Browse/share/rate |
| **Statistics** | ❌ No | ✅ Grades/streaks/charts |
| **Leaderboard** | ❌ No | ✅ Global/friends |

## Free Tier Limitations

**Routine Creation:** Max 2 routines. 3rd creation returns:
```json
{"detail": "Free users are limited to 2 routines. Upgrade to Premium for unlimited routines."}
```

**Premium Features:** Community, Statistics, Leaderboard return `403` with:
```json
{"detail": "Premium subscription required. Upgrade to access this feature."}
```

**Session Tracking:** Sessions tracked automatically but not viewable until upgrade.

## Premium Features (€3.99/month)

### Unlimited Routines
- No creation limits
- Full CRUD operations

### Community Access
- Browse all public routines
- Search/filter by name, author, tags
- Rate routines (1-5 stars)
- Share your routines publicly

### Statistics & Analytics
- Total routines completed, time spent
- Current/longest streak tracking
- Grade levels (Bronze → Legend)
- 30-day charts (routines/day, duration/day)
- Recent session history

**Grade Requirements:**
- Bronze: 10 routines + 5 days + 1 hour
- Silver: 50 routines + 15 days + 5 hours
- Gold: 150 routines + 30 days + 15 hours
- Platinum: 300 routines + 60 days + 30 hours
- Diamond: 600 routines + 120 days + 60 hours
- Legend: 1000 routines + 200 days + 100 hours

### Leaderboard
- Global rankings by score: `routines * 10 + streak * 5 + time_hours * 2`
- Friends-only leaderboard
- View your rank, score, grade level

## Stripe Integration

### Checkout Flow
1. User clicks "Upgrade to Premium" → `POST /api/subscriptions/create-checkout-session`
2. Backend creates Stripe Checkout session → redirects to Stripe
3. User completes payment → Stripe sends `checkout.session.completed` webhook
4. Backend updates user `subscription_tier` to `premium`

### Webhook Events
- `checkout.session.completed` - Initial subscription created
- `customer.subscription.updated` - Subscription changes (renew, downgrade)
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_failed` - Payment failure

### Customer Portal
Users manage subscription via `GET /api/subscriptions/portal` → redirects to Stripe Customer Portal:
- Update payment method
- View invoices
- Cancel subscription

### Environment Variables
```bash
# Required in backend/.env
STRIPE_SECRET_KEY=sk_test_...          # Backend API key
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Frontend public key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signature verification
STRIPE_PRICE_ID=price_...              # Premium subscription price ID
```

## Stripe Setup - Step by Step

### 1. Create Stripe Account
- Sign up at [stripe.com](https://stripe.com)
- Start in Test Mode (default)

### 2. Get API Keys
- Go to [Dashboard → API Keys](https://dashboard.stripe.com/test/apikeys)
- Copy **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)

### 3. Create Premium Product
1. Go to [Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Click "+ Add product"
3. Fill details:
   - Name: `FortiFlow Premium`
   - Description: `Premium subscription - Unlimited routines, Community, Statistics`
   - Price: `3.99 EUR`
   - Billing: `Monthly` / `Recurring`
4. Save and copy **Price ID** (`price_...`)

### 4. Setup Webhook (Local Development)

**Option A: Stripe CLI (Recommended)**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # Mac
# Or download from https://github.com/stripe/stripe-cli/releases

# Login and forward webhooks
stripe login
stripe listen --forward-to http://localhost:3000/api/subscriptions/webhook

# Copy webhook signing secret (whsec_...) to .env
```

**Option B: ngrok**
```bash
# Start ngrok
ngrok http 3000

# Create webhook at https://dashboard.stripe.com/test/webhooks
# Endpoint URL: https://YOUR_NGROK_URL/api/subscriptions/webhook
# Events: checkout.session.completed, customer.subscription.*, invoice.payment_failed
```

### 5. Test Payment Flow

**Test Cards:**
- Success: `4242 4242 4242 4242` (any future date, any CVC)
- Declined: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

**Testing Steps:**
1. Start backend with webhook listener
2. Go to Billing page → "Upgrade to Premium"
3. Enter test card `4242 4242 4242 4242`
4. Complete checkout
5. Verify webhook received and user upgraded

### 6. Production Setup
1. Activate Stripe account (complete verification)
2. Switch to Live Mode in Dashboard
3. Copy **Live API keys** (start with `pk_live_...` and `sk_live_...`)
4. Create production webhook endpoint
5. Update production `.env` with live keys

## API Endpoints

**Subscriptions:**
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout (redirects)
- `GET /api/subscriptions/portal` - Customer Portal session (manage subscription)
- `GET /api/subscriptions/status` - Current user's subscription status
- `POST /api/subscriptions/webhook` - Stripe webhook handler (internal)

**Statistics (Premium only):**
- `POST /api/statistics/session/start` - Start routine session tracking
- `POST /api/statistics/session/{id}/complete` - Complete session with duration
- `GET /api/statistics/me` - User stats (completed, time, streaks, grade)
- `GET /api/statistics/chart-data` - 30-day chart data
- `GET /api/statistics/sessions/recent` - Recent session history

**Leaderboard (Premium only):**
- `GET /api/leaderboard/global` - Global rankings (paginated)
- `GET /api/leaderboard/friends` - Friends rankings
- `GET /api/leaderboard/me` - Current user's position and stats

## Implementation Details

### Access Control

**Backend:**
```python
# Use require_premium dependency for Premium-only routes
from auth import require_premium

@router.get("/statistics/me", dependencies=[Depends(require_premium)])
async def get_user_stats(...):
    # Premium-only endpoint
```

**Frontend:**
```tsx
// Use PremiumRoute wrapper for Premium-only pages
<Route path="/statistics" element={<PremiumRoute><Statistics /></PremiumRoute>} />

// Or check subscription tier directly
{user.subscription_tier === 'premium' ? <Feature /> : <PaywallModal />}
```

### Session Tracking Flow
1. User starts routine → `POST /api/statistics/session/start` with `routine_id`
2. Returns `session_id` and `started_at` timestamp
3. User completes → Frontend calculates `total_duration`
4. `POST /api/statistics/session/{id}/complete` with `total_duration`
5. Backend updates: `completed=true`, `completed_at`, `total_duration`
6. Statistics endpoints query `routine_sessions` for streaks/grades/charts

### Database Schema

**users:**
- `subscription_tier` (enum: 'free' | 'premium')
- `trial_ends_at` (datetime, nullable)

**subscriptions:**
- `user_id` (FK unique)
- `stripe_customer_id`, `stripe_subscription_id`
- `subscription_status` (enum: 'free' | 'active' | 'canceled' | 'past_due')
- `current_period_start`, `current_period_end`, `cancel_at_period_end`

**routine_sessions:**
- `user_id` (FK), `routine_id` (FK)
- `started_at`, `completed_at`
- `total_duration` (seconds), `completed` (boolean)

### Migration

Run migration to add subscription tables:
```bash
cd backend
python scripts/migrate_add_subscriptions.py
```

Supports both SQLite (dev) and PostgreSQL (prod) with idempotent operations.

## Troubleshooting

**Webhook not working:**
- Check Stripe CLI is running: `stripe listen --forward-to ...`
- Verify `STRIPE_WEBHOOK_SECRET` in `.env`
- Check backend logs for webhook errors

**Payment failing:**
- Ensure in Test Mode for test cards
- Check Stripe Dashboard → Logs for detailed error

**User not upgraded after payment:**
- Check webhook received: `POST /api/subscriptions/webhook`
- Verify user's `subscription_tier` updated in database
- Check Stripe Dashboard → Customers for subscription status

**Free tier limit not working:**
- Verify `config.py` has `FREE_MAX_ROUTINES = 2`
- Check routine creation endpoint has limit check
- Ensure user `subscription_tier` correctly set
