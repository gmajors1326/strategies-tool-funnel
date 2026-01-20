# The Strategy Tools

Premium funnel landing page with embedded interactive tools for strategic engagement and conversion.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase Postgres (via Prisma)
- **Styling**: TailwindCSS + shadcn/ui
- **Payments**: Stripe Checkout
- **Email**: Resend (default) or Gmail SMTP (fallback)
- **AI**: OpenAI GPT-4 Turbo (on-demand, server-side)
- **Animations**: Framer Motion
- **Monitoring**: Sentry (error tracking), Structured logging
- **Rate Limiting**: Redis (Upstash) or in-memory store
- **Security**: Security headers, CSRF protection, Origin validation

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase)
- Stripe account
- Resend account (or Gmail for SMTP)
- OpenAI API key (for AI features)

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

# AI Provider (Required for AI features)
OPENAI_API_KEY="sk-xxxxxxxxxxxxx"
# Optional: Override default model
# OPENAI_MODEL="gpt-4-turbo-preview"

# Monitoring & Error Tracking (Optional)
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"

# Rate Limiting (Optional for Production)
REDIS_URL="https://xxxxx.upstash.io"
REDIS_TOKEN="xxxxx"

# Security (Optional)
INTERNAL_API_KEY="generate-random-32-chars-minimum-here"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (create database first in Supabase)
npm run migrate:run

# Seed Knowledge Vault (strategy content, prompts, rubrics)
npm run seed:knowledge
```

**Note**: The Knowledge Vault contains curated strategy content, prompt profiles (Strategist/Closer voices), and tool-specific rubrics. This powers the AI enhancement layer.

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

### 5. Knowledge Vault Setup

The Knowledge Vault is a database-backed intelligence system that ensures AI outputs are consistent, premium, and non-generic.

**Seed the Knowledge Vault**:
```bash
npm run seed:knowledge
```

This populates:
- **Prompt Profiles**: Strategist and Closer voice guidelines
- **Knowledge Items**: Strategy content, playbooks, guardrails, templates
- **Prompt Rubrics**: Tool-specific input/output schemas and reasoning rules

**Knowledge Vault Structure**:
- `KnowledgeItem`: Curated content chunks (diagnostic, engagement, DM, objections, conversion, guardrails, voice)
- `PromptProfile`: Voice guidelines for Strategist (calm, diagnostic) vs Closer (direct, conversion-focused)
- `PromptRubric`: Tool-specific schemas and safety rules
- `AiUsageLog`: Tracks AI usage for rate limiting and cost monitoring

### 6. Local Development

```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000`

### 7. Stripe Webhook Testing (Local)

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
│   ├── ai.ts              # AI service (OpenAI)
│   ├── ai-usage.ts         # AI rate limiting
│   ├── knowledge.ts       # Knowledge Vault retrieval
│   ├── tool-execution.ts  # Unified tool execution with AI
│   └── tools/             # Tool logic (deterministic)
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

### AI Enhancement Layer
- **On-demand AI**: AI runs only on explicit tool submissions (not a chat interface)
- **Dual Response Styles**:
  - **Strategist**: Calm, diagnostic, prioritization-focused (for planning/diagnostic tools)
  - **Closer**: Direct, action-forward, objection-aware (for DM/conversion tools)
- **Knowledge Vault**: Database-backed intelligence ensures consistent, premium outputs
- **Rate Limiting**: Plan-based daily AI usage caps
  - Anonymous: No AI access
  - Verified Free: 3 AI calls/day (preview)
  - DM Engine: 20 AI calls/day
  - The Strategy: 30 AI calls/day
  - All Access: 50 AI calls/day
- **Cost Controls**: Token tracking, cost estimation, usage logging
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
- Rate limiting on OTP requests and API endpoints
- httpOnly cookies for sessions
- Stripe webhook signature verification
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Origin validation (CSRF protection)
- API authentication middleware helpers
- IP-based rate limiting for anonymous users

## Monitoring & Observability

- **Structured Logging**: Consistent logging format with context
- **Error Tracking**: Sentry integration for error monitoring
- **Health Check**: `/api/health` endpoint for infrastructure monitoring
- **Rate Limiting**: Configurable rate limits per endpoint type
- **Performance Tracking**: Request duration logging

See [MONITORING_SECURITY.md](./docs/MONITORING_SECURITY.md) for detailed documentation.

## License

Private - All rights reserved
