# Supabase CLI Setup

This project now includes Supabase CLI configuration for local development and database management.

## Installation

Install the Supabase CLI globally:

```bash
# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# macOS (using Homebrew)
brew install supabase/tap/supabase

# Linux (using npm)
npm install -g supabase

# Or using npm locally (recommended)
npm install -g supabase
```

## Configuration

The Supabase CLI is configured with:
- **Project Reference**: `ezdpaqrfrzmbokwpknhb`
- **Project URL**: https://ezdpaqrfrzmbokwpknhb.supabase.co
- **Config File**: `supabase/config.toml`
- **Project Ref File**: `.supabase/project-ref`

## Available Commands

### Local Development

```bash
# Start local Supabase instance (includes Postgres, Studio, Auth, etc.)
npm run supabase:start

# Stop local Supabase instance
npm run supabase:stop

# Check status of local Supabase services
npm run supabase:status

# Open Supabase Studio (local dashboard)
npm run supabase:studio
```

### Link to Remote Project

```bash
# Link to your remote Supabase project
npm run supabase:link

# Or manually:
supabase link --project-ref ezdpaqrfrzmbokwpknhb
```

### Database Management

```bash
# Push local schema changes to remote database
npm run supabase:db:push

# Pull remote schema changes to local
npm run supabase:db:pull

# Generate a migration from local schema changes
npm run supabase:db:diff
```

## Important Notes

⚠️ **This project uses Prisma for schema management**

- The Supabase CLI is primarily for:
  - Local development/testing
  - Database introspection
  - Managing migrations alongside Prisma
  - Accessing Supabase Studio locally

- **For production migrations**, continue using Prisma:
  ```bash
  npm run migrate:run
  npx prisma migrate deploy
  ```

## Workflow

### Option 1: Prisma-First (Current)
1. Make schema changes in `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev`
3. Apply to remote: `npm run migrate:run`

### Option 2: Supabase CLI-First
1. Make schema changes via Supabase Studio or SQL
2. Pull changes: `npm run supabase:db:pull`
3. Generate Prisma schema: `npx prisma db pull`
4. Sync Prisma Client: `npm run prisma:generate`

### Option 3: Hybrid
- Use Supabase CLI for local development/testing
- Use Prisma for production migrations
- Keep both in sync manually

## Local Development URLs

When running `supabase start`, you'll get:

- **API URL**: http://localhost:54321
- **DB URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323
- **Inbucket (Email)**: http://localhost:54324

## Troubleshooting

### Reset Local Database
```bash
supabase db reset
```

### View Logs
```bash
supabase logs
```

### Check Connection
```bash
npm run db:check
```

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [Prisma + Supabase Guide](https://supabase.com/docs/guides/integrations/prisma)
- Project Setup: See `SUPABASE_SETUP.md`
