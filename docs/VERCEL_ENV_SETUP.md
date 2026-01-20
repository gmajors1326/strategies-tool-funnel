# Pushing Environment Variables to Vercel

This guide shows you how to push your `.env` file variables to Vercel.

## ⚠️ Important Security Note

**Never commit `.env` files to Git!** They contain sensitive credentials. Always use `.env.example` as a template and keep actual `.env` files local.

## Method 1: Using the Script (Recommended)

### Windows (PowerShell)
```powershell
.\scripts\push-env-to-vercel.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x scripts/push-env-to-vercel.sh
./scripts/push-env-to-vercel.sh
```

### Node.js (Cross-platform)
```bash
npm run vercel:env
# or
node scripts/push-env-to-vercel.js
```

## Method 2: Using Vercel CLI Directly

### Interactive Mode (Easiest)
```bash
vercel env add
```
This will prompt you to:
1. Select the variable name
2. Enter the value
3. Choose environments (Production, Preview, Development)

### Add Single Variable
```bash
vercel env add VARIABLE_NAME production
# Then paste the value when prompted
```

### Add Multiple Variables from .env
```bash
# Read .env and add each variable
cat .env | grep -v '^#' | grep -v '^$' | while read line; do
  key=$(echo $line | cut -d '=' -f 1)
  value=$(echo $line | cut -d '=' -f 2- | sed 's/^"//;s/"$//')
  echo "$value" | vercel env add "$key" production
done
```

## Method 3: Via Vercel Dashboard (Manual)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `strategies-tool-funnel`
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select Production, Preview, and/or Development
6. Click **Save**

## Required Environment Variables

Based on `.env.example`, you need to set:

### Database
- `DATABASE_URL` - Supabase Postgres connection string

### Auth
- `NEXTAUTH_SECRET` - Secret key (min 32 chars)
- `SESSION_SECRET` - Session secret (min 32 chars)

### Email (Choose one)
**Option A: Resend (Recommended)**
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM` - Verified sender email (e.g., `hello@yourdomain.com`)
- `RESEND_FROM_NAME` - Sender name (optional)

**Option B: Gmail SMTP**
- `USE_GMAIL_SMTP=true`
- `GMAIL_USER` - Your Gmail address
- `GMAIL_APP_PASSWORD` - Gmail app password

### Admin
- `ADMIN_EMAIL` - Email for admin notifications

### Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRICE_ID_DM_ENGINE` - DM Engine price ID
- `STRIPE_PRICE_ID_THE_STRATEGY` - The Strategy price ID
- `STRIPE_PRICE_ID_ALL_ACCESS` - All Access price ID

### App
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-domain.vercel.app`)

## Verify Variables Are Set

```bash
# List all environment variables
vercel env ls

# Check a specific variable
vercel env ls VARIABLE_NAME
```

## Troubleshooting

### "Vercel CLI not found"
```bash
npm install -g vercel
```

### "Not logged in"
```bash
vercel login
```

### "Project not linked"
```bash
vercel link
```

### Variables not updating
- Make sure you're setting variables for the correct environment (Production/Preview/Development)
- Redeploy after adding variables: `vercel --prod`

## Quick Setup Checklist

- [ ] Create `.env` file locally (copy from `.env.example`)
- [ ] Fill in all required values
- [ ] Run `npm run vercel:env` or use Vercel dashboard
- [ ] Verify variables: `vercel env ls`
- [ ] Trigger a new deployment to apply changes

## After Setting Variables

1. **Redeploy** to apply new environment variables:
   ```bash
   vercel --prod
   ```
   Or push to `main` branch (Vercel auto-deploys)

2. **Verify** the deployment uses the correct variables:
   - Check Vercel dashboard → Deployments → View logs
   - Ensure no "undefined" or missing variable errors

3. **Test** your application:
   - Visit your Vercel URL
   - Test authentication flow
   - Test Stripe checkout
   - Verify email sending
