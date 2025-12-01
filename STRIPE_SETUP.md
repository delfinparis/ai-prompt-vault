# Stripe Setup Guide

## 1. Create a Stripe Account

1. Go to https://stripe.com/
2. Sign up for a free account
3. Complete the onboarding process

## 2. Get Your API Keys

1. Navigate to https://dashboard.stripe.com/apikeys
2. You'll see two sets of keys:
   - **Test mode** keys (for development)
   - **Live mode** keys (for production)

3. For development, use **Test mode** keys:
   - Copy the **Publishable key** (starts with `pk_test_`)
   - Copy the **Secret key** (starts with `sk_test_`)

4. Add them to your `.env.local` file:
   ```
   STRIPE_SECRET_KEY=sk_test_your_actual_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   ```

## 3. Set Up Webhook Endpoint

Webhooks are required to automatically add credits when payments succeed.

### Option A: Local Development with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

### Option B: Production Webhook

1. Deploy your app to Vercel first
2. Go to https://dashboard.stripe.com/webhooks
3. Click "Add endpoint"
4. Enter your webhook URL: `https://your-app.vercel.app/api/stripe/webhook`
5. Select events to listen to:
   - `checkout.session.completed`
6. Copy the webhook signing secret and add to Vercel environment variables

## 4. Test the Payment Flow

1. Start your development server: `npm run dev`
2. Create an account
3. Click "Buy Credits"
4. Use Stripe test credit card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/25)
   - Any 3-digit CVC
   - Any 5-digit ZIP code

5. Complete the checkout
6. You should be redirected back to the dashboard
7. Credits should be added to your account (via webhook)

## 5. Going Live

When ready to accept real payments:

1. Complete Stripe account verification
2. Switch to **Live mode** in Stripe dashboard
3. Get your **Live mode** API keys
4. Update your `.env.local` (and Vercel environment variables) with live keys:
   ```
   STRIPE_SECRET_KEY=sk_live_your_actual_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key_here
   ```
5. Set up production webhook endpoint (as described in Option B above)

## 6. Stripe Dashboard

Monitor your payments at: https://dashboard.stripe.com/payments

You can:
- View all transactions
- Issue refunds
- See customer details
- View webhook logs
- Test different scenarios

## Test Card Numbers

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient funds**: 4000 0000 0000 9995
- **3D Secure required**: 4000 0025 0000 3155

More test cards: https://stripe.com/docs/testing

## Pricing

Stripe charges:
- **2.9% + $0.30** per successful transaction
- For your $4.99 credit purchase: ~$0.44 in fees (you keep $4.55)
- No monthly fees, no setup fees
