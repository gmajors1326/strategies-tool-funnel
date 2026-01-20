# Supabase Database Setup

## Your Supabase Project
- **Project URL**: https://ezdpaqrfrzmbokwpknhb.supabase.co
- **Project Reference**: `ezdpaqrfrzmbokwpknhb`

## Getting the DATABASE_URL

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/ezdpaqrfrzmbokwpknhb
2. Or navigate to: Settings → Database

### Step 2: Find Connection String
1. In the Database settings, look for **"Connection string"** section
2. You'll see different connection modes:
   - **Session mode** (direct connection)
   - **Transaction mode** (connection pooling) ← **Use this for Vercel**
   - **Statement mode** (connection pooling)

### Step 3: Copy the URI
For Vercel/serverless, use the **Transaction mode** URI:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 4: Replace Password
- Replace `[PASSWORD]` with your actual database password
- If you don't know it, reset it in: Settings → Database → Database password

## Important Notes

⚠️ **We do NOT use Supabase client libraries or API keys**
- This app uses Supabase **only as a Postgres host**
- All database access goes through Prisma
- The Supabase publishable key is **not needed** for this app

## Connection String Format

Your `DATABASE_URL` should look like:
```
postgresql://postgres.ezdpaqrfrzmbokwpknhb:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

Or for direct connection (Session mode):
```
postgresql://postgres.ezdpaqrfrzmbokwpknhb:[YOUR_PASSWORD]@db.ezdpaqrfrzmbokwpknhb.supabase.co:5432/postgres
```

**For Vercel/serverless, prefer the Transaction mode (port 6543) with connection pooling.**

## After Getting DATABASE_URL

1. Add it to your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres.ezdpaqrfrzmbokwpknhb:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
   ```

2. Push to Vercel:
   ```bash
   npm run vercel:env
   ```

3. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
