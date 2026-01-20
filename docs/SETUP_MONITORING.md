# Setting Up Monitoring & Security Features

This guide walks you through setting up the monitoring, rate limiting, and security features.

## Step 1: Install Dependencies

The new features require the Sentry package. Install it:

```bash
npm install @sentry/nextjs
```

## Step 2: Set Up Sentry (Optional but Recommended)

1. **Create a Sentry Account**
   - Go to https://sentry.io
   - Sign up for a free account

2. **Create a Next.js Project**
   - In Sentry dashboard, click "Create Project"
   - Select "Next.js"
   - Follow the setup instructions

3. **Get Your DSN**
   - After creating the project, copy the DSN
   - It looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

4. **Add to Environment Variables**
   ```env
   NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
   NEXT_PUBLIC_SENTRY_ENVIRONMENT="production" # or "development", "staging"
   ```

5. **Configure Sentry Organization/Project (for source maps)**
   ```env
   SENTRY_ORG="your-org-slug"
   SENTRY_PROJECT="your-project-slug"
   ```
   These are optional but needed for automatic source map uploads.

## Step 3: Set Up Redis for Rate Limiting (Production)

For production, Redis is recommended for rate limiting. Upstash offers a free tier:

1. **Create Upstash Redis Instance**
   - Go to https://upstash.com
   - Sign up for a free account
   - Create a new Redis database
   - Choose a region close to your deployment

2. **Get Connection Details**
   - Copy the REST URL (looks like: `https://xxxxx.upstash.io`)
   - Copy the REST Token

3. **Add to Environment Variables**
   ```env
   REDIS_URL="https://xxxxx.upstash.io"
   REDIS_TOKEN="xxxxx"
   ```

**Note**: In development, the app uses an in-memory store, so Redis is optional. In production without Redis, it will still work but rate limits won't persist across server restarts.

## Step 4: Verify Setup

1. **Test Health Check**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return JSON with status information.

2. **Test Rate Limiting**
   - Make multiple rapid requests to any API endpoint
   - Check response headers for `X-RateLimit-*` headers
   - After exceeding limit, should get 429 status

3. **Test Sentry (if configured)**
   - Trigger an error in your app
   - Check Sentry dashboard for the error
   - Should see error details, stack trace, and context

4. **Check Logs**
   - Look for structured logs in console
   - Should see timestamps, log levels, and context

## Step 5: Update Your API Routes (Optional)

You can now use the new logging and error tracking in your API routes:

```typescript
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/sentry'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Your code here
    
    const duration = Date.now() - startTime
    logger.apiRequest('POST', '/api/your-endpoint', 200, duration)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Operation failed', error)
    captureException(error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

## Step 6: Use Authentication Middleware (Optional)

Protect your API routes with authentication:

```typescript
import { withAuth, withPlan, withEntitlement } from '@/lib/api-auth'

// Require authentication
export const POST = withAuth(async (request, session) => {
  // session.userId, session.email, session.plan are available
  return NextResponse.json({ userId: session.userId })
})

// Require specific plan
export const POST = withPlan('DM_ENGINE', async (request, session) => {
  // User has DM_ENGINE plan or higher
  return NextResponse.json({ plan: session.plan })
})

// Require specific entitlement
export const POST = withEntitlement('dmEngine', async (request, session, entitlements) => {
  // User has dmEngine entitlement
  return NextResponse.json({ entitlements })
})
```

## Troubleshooting

### Sentry Not Working

- Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check browser console for Sentry initialization errors
- Ensure Sentry project is active in dashboard
- For source maps, verify `SENTRY_ORG` and `SENTRY_PROJECT` are set

### Rate Limiting Not Working

- Check Redis connection (if using Redis)
- Verify rate limit headers in response
- Check middleware logs for errors
- In development, in-memory store resets on server restart

### Security Headers Missing

- Verify middleware is running (check logs)
- Ensure `next.config.js` is properly configured
- Check that routes match middleware matcher pattern

### Health Check Failing

- Verify database connection string
- Check database is accessible
- Review health check logs for specific failures

## Next Steps

- Monitor Sentry dashboard for errors
- Set up alerts in Sentry for critical errors
- Review rate limit logs to identify abuse patterns
- Adjust rate limit configurations based on usage patterns
- Set up monitoring for the health check endpoint
