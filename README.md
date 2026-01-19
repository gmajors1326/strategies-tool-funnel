# The Strategy Tools

Premium funnel landing page with embedded interactive tools for strategic engagement and conversion.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase Postgres (via Prisma)
- **Styling**: TailwindCSS + shadcn/ui
- **Payments**: Stripe Checkout
- **Email**: Resend (default) or Gmail SMTP (fallback)
- **Animations**: Framer Motion

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase)
- Stripe account
- Resend account (or Gmail for SMTP)

## Setup Instructions

### 1. Clone and Install

```bash
cd strategy-tools-funnel
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Auth
NEXTAUTH_SECRET="your-secret-key-here-min-32-chars"
SESSION_SECRET="your-session-secret-here-min-32-chars"

# Email (Resend - default)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM="hello@yourdomain.com"
RESEND_FROM_NAME="The Strategy Tools"

# Email (Gmail SMTP - optional fallback)
USE_GMAIL_SMTP=false
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# Admin
ADMIN_EMAIL="admin@example.com"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
STRIPE_PRICE_ID_DM_ENGINE="price_xxxxxxxxxxxxx"
STRIPE_PRICE_ID_THE_STRATEGY="price_xxxxxxxxxxxxx"
STRIPE_PRICE_ID_ALL_ACCESS="price_xxxxxxxxxxxxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (create database first in Supabase)
npm run prisma:migrate
```

### 4. Stripe Setup

1. Create products in Stripe Dashboard:
   - DM Engine
   - The Strategy
   - All Access

2. Copy the Price IDs and add them to `.env`:
   - `STRIPE_PRICE_ID_DM_ENGINE`
   - `STRIPE_PRICE_ID_THE_STRATEGY`
   - `STRIPE_PRICE_ID_ALL_ACCESS`

3. Set up webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. Local Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000`

### 6. Stripe Webhook Testing (Local)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret and use it for `STRIPE_WEBHOOK_SECRET` in local `.env`.

## Deployment to Vercel

### 1. Push to Git

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Vercel Setup

1. Connect your repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### 3. Post-Deployment

1. Run Prisma migrations manually:
   ```bash
   npx prisma migrate deploy
   ```

2. Update Stripe webhook URL:
   - Go to Stripe Dashboard → Webhooks
   - Update endpoint URL to: `https://your-domain.com/api/stripe/webhook`

## Automated Deployment

This project includes automated deployment workflows for Git and Vercel.

### Automatic Vercel Deployment

When you push to the `main` branch, Vercel automatically deploys (if connected via GitHub integration).

### Deployment Scripts

**Quick Deploy (Node.js):**
```bash
npm run deploy "Your commit message"
```

**PowerShell (Windows):**
```powershell
.\scripts\deploy.ps1 -CommitMessage "Your commit message"
```

**Bash (Linux/Mac):**
```bash
./scripts/deploy.sh "Your commit message"
```

**Git-only push:**
```bash
npm run deploy:git
```

### GitHub Actions

The repository includes GitHub Actions workflows:

- **CI Workflow** (`.github/workflows/ci.yml`): Runs tests and linting on every push/PR
- **Vercel Auto Deploy** (`.github/workflows/vercel-auto-deploy.yml`): Validates build before Vercel deploys

### Setup GitHub Actions Secrets (Optional)

If you want to use the full GitHub Actions deployment workflow, add these secrets:

1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add secrets:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `VERCEL_TOKEN` (optional, for GitHub Actions → Vercel)
   - `VERCEL_ORG_ID` (optional)
   - `VERCEL_PROJECT_ID` (optional)

**Note:** Vercel's GitHub integration handles deployment automatically. GitHub Actions are mainly for CI/CD validation.

## Project Structure

```
strategy-tools-funnel/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # OTP authentication
│   │   ├── tools/         # Tool endpoints
│   │   └── stripe/        # Stripe integration
│   ├── account/           # Account page
│   ├── verify/            # Email verification
│   ├── success/           # Stripe success page
│   ├── cancel/            # Stripe cancel page
│   └── page.tsx           # Main funnel page
├── components/            # React components
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities
│   ├── db.ts              # Prisma client (singleton)
│   ├── auth.ts            # Session management
│   ├── email.ts           # Email sending
│   ├── entitlements.ts    # Plan entitlements
│   ├── stripe.ts          # Stripe client
│   └── tools/             # Tool logic
├── prisma/                # Prisma schema
└── __tests__/             # Unit tests
```

## Features

### Free Tools
- **Engagement Diagnostic (Lite)**: Get engagement tier and actionable insight
- **DM Opener Generator (Lite)**: Generate DM openers based on scenario
- **Hook Repurposer™**: Turn one hook into multiple strategic angles

### Paid Tools (Locked)
- Strategic Engagement Planner
- Comment Impact Engine
- DM Engine Full Flows
- Timing Engine
- Saved Results & Exports

### Plans
- **DM Engine**: DM flows and follow-ups
- **The Strategy**: Full engagement system
- **All Access**: Everything in DM Engine + The Strategy

## Testing

```bash
# Run tests
npm test
```

## Database Schema

- **User**: User accounts and plans
- **Profile**: User profile data
- **ToolRun**: Saved tool runs
- **Otp**: Email verification codes
- **PlanEntitlement**: Plan access flags

## Security

- OTP codes are hashed in database
- Rate limiting on OTP requests
- httpOnly cookies for sessions
- Stripe webhook signature verification

## License

Private - All rights reserved
