# Deployment Checklist

## Pre-Deployment

### 1. Database Setup
- [ ] Create Supabase Postgres database
- [ ] Copy `DATABASE_URL` connection string
- [ ] Run Prisma migrations: `npm run prisma:migrate`
- [ ] Verify tables created: `npm run prisma:studio`

### 2. Stripe Setup
- [ ] Create Stripe account (or use existing)
- [ ] Create two products:
  - Pro
  - Elite
- [ ] Create prices for each product (one-time payment)
- [ ] Copy Price IDs to environment variables:
  - `STRIPE_PRICE_ID_PRO_MONTHLY`
  - `STRIPE_PRICE_ID_ELITE_MONTHLY`
- [ ] Copy API keys:
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`

### 3. Email Setup
- [ ] Choose email provider:
  - **Option A**: Resend (recommended)
    - Create Resend account
    - Copy `RESEND_API_KEY`
  - **Option B**: Gmail SMTP
    - Set `USE_GMAIL_SMTP=true`
    - Set `GMAIL_USER` and `GMAIL_APP_PASSWORD`

### 4. Environment Variables
- [ ] Set `ADMIN_EMAIL` for notifications
- [ ] Generate secrets:
  - `NEXTAUTH_SECRET` (min 32 chars)
  - `SESSION_SECRET` (min 32 chars)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain

## Vercel Deployment

### 1. Connect Repository
- [ ] Push code to Git repository
- [ ] Connect repository to Vercel
- [ ] Vercel will auto-detect Next.js

### 2. Configure Environment Variables
Add all variables from `.env` to Vercel dashboard:
- Database
- Auth secrets
- Email config
- Stripe keys
- App URL

### 3. Deploy
- [ ] Push to `main` branch (auto-deploys)
- [ ] Monitor build logs
- [ ] Verify build succeeds

### 4. Post-Deployment

#### Database
- [ ] Run migrations on production:
  ```bash
  npx prisma migrate deploy
  ```
  Or via Vercel CLI:
  ```bash
  vercel env pull
  npx prisma migrate deploy
  ```

#### Stripe Webhook
- [ ] Go to Stripe Dashboard → Webhooks
- [ ] Add endpoint: `https://your-domain.com/api/stripe/webhook`
- [ ] Select event: `checkout.session.completed`
- [ ] Copy webhook signing secret
- [ ] Add to Vercel env: `STRIPE_WEBHOOK_SECRET`

#### Testing
- [ ] Test free tools (no auth required)
- [ ] Test OTP verification flow
- [ ] Test Stripe checkout (use test mode)
- [ ] Verify webhook grants entitlements
- [ ] Test account page shows saved results

## Production Checklist

- [ ] Switch Stripe to live mode
- [ ] Update Stripe keys in Vercel
- [ ] Test with real payment (small amount)
- [ ] Verify email delivery
- [ ] Check admin notifications
- [ ] Monitor error logs
- [ ] Set up monitoring/alerts

## Troubleshooting

### Build Fails
- Check Prisma Client generation: `npm run prisma:generate`
- Verify all environment variables are set
- Check Node.js version (18+)

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check Supabase connection settings
- Ensure database is accessible from Vercel IPs
- DNS failures mean the host cannot be resolved locally:
  - Switch DNS to `1.1.1.1` or `8.8.8.8`, or use a hotspot
  - Verify reachability:
    - `Test-NetConnection <host> -Port 5432`
    - Must show an IP and `TcpTestSucceeded True`
  - Then rerun:
    - `npx prisma migrate deploy` (prod)
    - `npx prisma migrate dev` (local)

### Stripe Webhook Not Working
- Verify webhook URL is correct
- Check webhook secret matches
- Review Stripe webhook logs
- Test with Stripe CLI locally first

### Email Not Sending
- Verify API key is correct
- Check email provider limits
- Review email provider logs
- Test with Gmail SMTP fallback
