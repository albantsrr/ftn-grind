# Stripe Setup Guide - FortiFlow

This guide will help you set up Stripe for subscription payments in FortiFlow.

## Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and sign up for an account
2. Complete the verification process (for production later)
3. You'll start in **Test Mode** by default (perfect for development)

## Step 2: Get Your API Keys

### Test Mode Keys (for development)

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. Copy the following keys:
   - **Publishable key**: Starts with `pk_test_...` (for frontend)
   - **Secret key**: Starts with `sk_test_...` (for backend) - Click "Reveal" to see it

### Add keys to .env file

Create or update `backend/.env` with:

```bash
# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # We'll get this in Step 4
STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE  # We'll get this in Step 3
```

## Step 3: Create the Premium Subscription Product

1. Go to [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
2. Click **"+ Add product"**
3. Fill in the details:
   - **Name**: `FortiFlow Premium`
   - **Description**: `Premium subscription for FortiFlow - Unlimited routines, Community access, and Statistics`
   - **Pricing model**: `Standard pricing`
   - **Price**: `3.99 EUR`
   - **Billing period**: `Monthly`
   - **Payment type**: `Recurring`
4. Click **"Save product"**
5. Copy the **Price ID** (starts with `price_...`)
6. Add it to your `.env` file as `STRIPE_PRICE_ID`

## Step 4: Set Up Webhook (for Local Testing)

### Option A: Using Stripe CLI (Recommended for local dev)

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   ```bash
   # Mac
   brew install stripe/stripe-cli/stripe

   # Windows
   # Download from https://github.com/stripe/stripe-cli/releases/latest
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhook events to your local backend:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/subscriptions/webhook
   ```

4. Copy the **webhook signing secret** (starts with `whsec_...`)
5. Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### Option B: Using ngrok (Alternative)

1. Install ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Start ngrok:
   ```bash
   ngrok http 3000
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Go to [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
5. Click **"+ Add endpoint"**
6. Enter endpoint URL: `https://YOUR_NGROK_URL/api/subscriptions/webhook`
7. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
8. Click **"Add endpoint"**
9. Copy the **Signing secret** and add to `.env` as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test Payment Flow

### Test with Stripe Test Cards

Stripe provides test card numbers that simulate different scenarios:

**Successful payment:**
- Card number: `4242 4242 4242 4242`
- Any future expiry date (e.g., `12/34`)
- Any 3-digit CVC (e.g., `123`)
- Any billing zip code

**Payment declined:**
- Card number: `4000 0000 0000 0002`

**Requires authentication (3D Secure):**
- Card number: `4000 0025 0000 3155`

More test cards: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

### Testing the Flow

1. Start your backend:
   ```bash
   cd backend
   ./run_backend.sh
   ```

2. Start Stripe webhook forwarding (in another terminal):
   ```bash
   stripe listen --forward-to http://localhost:3000/api/subscriptions/webhook
   ```

3. Test the API endpoints:

   **Create checkout session:**
   ```bash
   curl -X POST http://localhost:3000/api/subscriptions/create-checkout-session \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

   **Get subscription status:**
   ```bash
   curl http://localhost:3000/api/subscriptions/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. Open the checkout URL in your browser
5. Use test card `4242 4242 4242 4242` to complete payment
6. Check webhook logs to see events being received
7. Verify user is upgraded to premium in database

## Step 6: Production Setup (When Ready to Go Live)

### Switch to Live Mode

1. Complete Stripe account verification
2. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) (no "test" in URL)
3. Get your **Live keys**:
   - Publishable key: `pk_live_...`
   - Secret key: `sk_live_...`

### Create Production Product

1. Go to [https://dashboard.stripe.com/products](https://dashboard.stripe.com/products)
2. Create the same product but with live keys
3. Get the live `price_id`

### Set Up Production Webhook

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"+ Add endpoint"**
3. Enter your production URL: `http://72.61.166.22/api/subscriptions/webhook`
4. Select the same events as before
5. Copy the **Signing secret**

### Update Production .env

On your VPS, update `/opt/fortiflow/backend/.env`:

```bash
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
STRIPE_PRICE_ID=price_YOUR_LIVE_PRICE_ID
```

Then restart the backend:
```bash
cd /opt/fortiflow/backend
docker compose restart backend
```

## Troubleshooting

### Webhook not receiving events

- Check that Stripe CLI is running: `stripe listen --forward-to http://localhost:3000/api/subscriptions/webhook`
- Verify webhook secret in `.env` matches the one from Stripe CLI
- Check backend logs for errors: `docker compose logs -f backend`

### Checkout session fails

- Verify `STRIPE_PRICE_ID` in `.env` matches your product's price ID
- Check `STRIPE_SECRET_KEY` is set correctly
- Ensure backend is running and accessible

### User not upgraded after payment

- Check webhook is receiving events (Stripe CLI logs)
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check backend logs for webhook processing errors
- Manually verify in Stripe dashboard that payment succeeded

## Useful Stripe Dashboard Links

- **Test Mode Dashboard**: [https://dashboard.stripe.com/test](https://dashboard.stripe.com/test)
- **Products**: [https://dashboard.stripe.com/test/products](https://dashboard.stripe.com/test/products)
- **Customers**: [https://dashboard.stripe.com/test/customers](https://dashboard.stripe.com/test/customers)
- **Subscriptions**: [https://dashboard.stripe.com/test/subscriptions](https://dashboard.stripe.com/test/subscriptions)
- **Webhooks**: [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks)
- **Logs**: [https://dashboard.stripe.com/test/logs](https://dashboard.stripe.com/test/logs)
- **API Keys**: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)

## Next Steps

After setting up Stripe:

1. ✅ Test the complete payment flow with test cards
2. ✅ Verify webhooks are working correctly
3. ✅ Test subscription upgrade/downgrade
4. ✅ Test subscription cancellation
5. ✅ Implement frontend billing page
6. ✅ Add Premium restrictions to Community and Statistics routes
7. ✅ Add free tier limitation (max 2 routines)
8. 🚀 Switch to Live mode when ready for production
