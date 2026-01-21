# Monitoring, Rate Limiting & Security

This document describes the monitoring, rate limiting, and security features implemented in the application.

## Monitoring & Error Tracking

### Structured Logging

The application uses a structured logging system (`lib/logger.ts`) that provides:

- **Consistent log format**: All logs include timestamps, log levels, and structured context
- **Log levels**: `debug`, `info`, `warn`, `error`
- **Specialized loggers**: API requests, database queries, AI usage, authentication events, rate limiting

**Usage Example:**
```typescript
import { logger } from '@/lib/logger'

logger.info('User action', { userId: '123', action: 'tool_run' })
logger.error('Operation failed', error, { context: 'additional info' })
logger.apiRequest('POST', '/api/tools/run', 200, 150, { toolKey: 'hook-analyzer' })
```

### Sentry Integration

Sentry is integrated for error tracking and performance monitoring:

1. **Installation**: Already configured in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`
2. **Configuration**: Set `NEXT_PUBLIC_SENTRY_DSN` environment variable
3. **Features**:
   - Automatic error capture
   - Performance monitoring
   - Source map support
   - User context tracking
   - Breadcrumb tracking

**Setup:**
1. Create a Sentry account at https://sentry.io
2. Create a new project (Next.js)
3. Copy the DSN to your `.env` file:
   ```
   NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
   NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"
   ```

**Usage:**
```typescript
import { captureException, captureMessage, setUserContext } from '@/lib/sentry'

captureException(error, { context: 'additional info' })
captureMessage('Something happened', 'warning', { data: 'value' })
setUserContext(userId, email)
```

### Health Check Endpoint

A health check endpoint is available at `/api/health` that returns:

- Application status (healthy/degraded/unhealthy)
- Database connectivity and latency
- Memory usage
- Uptime information

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy", "latency": 5 },
    "memory": { "status": "healthy", "usage": 45.2 }
  }
}
```

## Rate Limiting

### Implementation

Rate limiting is implemented using an in-memory store (development) or Redis (production):

- **In-memory store**: Used in development/testing
- **Redis store**: Recommended for production (Upstash Redis is free tier friendly)

### Configuration

Rate limits are configured per endpoint type:

- **AI Endpoints**: 10 requests/minute
- **API Endpoints**: 60 requests/minute
- **Auth Endpoints**: 5 requests/15 minutes
- **OTP Requests**: 1 request/minute

### Rate Limit Headers

All rate-limited responses include headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (when exceeded)

### Setup Redis (Production)

1. Create a free Upstash Redis instance: https://upstash.com
2. Copy the REST URL and token to your `.env`:
   ```
   REDIS_URL="https://xxxxx.upstash.io"
   REDIS_TOKEN="xxxxx"
   ```

The application automatically uses Redis in production if `REDIS_URL` is configured.

## Security Features

### Security Headers

The middleware automatically applies security headers to all responses:

- **Strict-Transport-Security**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: XSS protection
- **Content-Security-Policy**: Restricts resource loading
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### Origin Validation

All API requests are validated against `NEXT_PUBLIC_APP_URL` to prevent CSRF attacks from unauthorized origins.

### IP Address Extraction

The system correctly extracts client IP addresses even when behind proxies/load balancers by checking:

1. `X-Forwarded-For` header (first IP)
2. `X-Real-IP` header
3. Connection remote address (fallback)

### API Authentication Middleware

Helper functions are available for protecting API routes:

**Require Authentication:**
```typescript
import { requireAuth } from '@/lib/api-auth'

const { session, response } = await requireAuth(request)
if (response) return response // Unauthorized
// Use session.userId, session.email, session.plan
```

**Require Plan:**
```typescript
import { requirePlan } from '@/lib/api-auth'

const { session, response } = await requirePlan(request, 'DM_ENGINE')
if (response) return response // Insufficient plan
```

**Require Entitlement:**
```typescript
import { requireEntitlement } from '@/lib/api-auth'

const { session, entitlements, response } = await requireEntitlement(request, 'dmEngine')
if (response) return response // Insufficient entitlement
```

**Route Wrappers:**
```typescript
import { withAuth, withPlan, withEntitlement } from '@/lib/api-auth'

export const POST = withAuth(async (request, session) => {
  // session is guaranteed to exist
  return NextResponse.json({ userId: session.userId })
})

export const POST = withPlan(['DM_ENGINE', 'ALL_ACCESS'], async (request, session) => {
  // User has required plan
  return NextResponse.json({ plan: session.plan })
})

export const POST = withEntitlement('dmEngine', async (request, session, entitlements) => {
  // User has required entitlement
  return NextResponse.json({ entitlements })
})
```

## Environment Variables

Add these to your `.env` file:

```env
# Monitoring
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
NEXT_PUBLIC_SENTRY_ENVIRONMENT="production"

# Rate Limiting (Optional for Production)
REDIS_URL="https://xxxxx.upstash.io"
REDIS_TOKEN="xxxxx"

# Security (Optional)
INTERNAL_API_KEY="generate-random-32-chars-minimum-here"
```

## Best Practices

1. **Always use structured logging** instead of `console.log`
2. **Capture exceptions** to Sentry for production errors
3. **Set user context** in Sentry when user is authenticated
4. **Monitor health endpoint** in your infrastructure
5. **Use rate limiting** to protect expensive operations (AI calls)
6. **Validate origins** for all API requests
7. **Use authentication middleware** helpers for protected routes

## Troubleshooting

### Rate Limiting Not Working

- Check Redis connection (if using Redis)
- Verify rate limit headers in response
- Check middleware is running (should see logs)

### Sentry Not Capturing Errors

- Verify `NEXT_PUBLIC_SENTRY_DSN` is set
- Check Sentry project settings
- Verify source maps are uploaded (in production)

### Security Headers Missing

- Verify middleware is running
- Check `next.config.js` configuration
- Ensure middleware matcher includes your routes
