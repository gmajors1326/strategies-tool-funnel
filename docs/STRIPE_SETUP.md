# Stripe Products Setup

## Quick Setup (5 minutes)

### Option 1: Stripe Dashboard (Recommended)

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Click **"Add product"** for each plan:

#### Pro
- **Name:** Pro
- **Description:** For serious creators scaling output
- **Pricing:** $39.00 USD (monthly)
- **Copy the Price ID** (starts with `price_`)

#### Elite
- **Name:** Elite
- **Description:** For high-volume growth teams
- **Pricing:** $99.00 USD (monthly)
- **Copy the Price ID**

3. Add Price IDs to Vercel:
   - Vercel → Project → Settings → Environment Variables
   - Add each:
     - `STRIPE_PRICE_ID_PRO_MONTHLY` = `price_xxxxx`
     - `STRIPE_PRICE_ID_ELITE_MONTHLY` = `price_xxxxx`
   - Make sure **Production** is checked
   - Save

4. Redeploy (or wait for auto-deploy)

### Option 2: Script (Requires Stripe Secret Key)

1. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxxxx
   ```

2. Run:
   ```bash
   node scripts/setup-stripe-prices.js
   ```

3. Copy the output Price IDs to Vercel (as above)

---

## Test Mode vs Live Mode

- **Test Mode:** Use `sk_test_...` and `pk_test_...` keys
- **Live Mode:** Use `sk_live_...` and `pk_live_...` keys

Make sure all keys match the same mode (test or live).
