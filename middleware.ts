import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurityHeaders, validateOrigin, getClientIp } from '@/lib/security'
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const SESSION_COOKIE_NAME = 'strategy-tools-session'

// Helper to get session from request cookies (middleware-compatible)
function getSessionFromRequest(request: NextRequest): { userId: string; email: string; plan: string } | null {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
    if (!sessionCookie?.value) {
      return null
    }

    const session = JSON.parse(sessionCookie.value) as { userId: string; email: string; plan: string }
    return session
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname

    // Create response
    let response = NextResponse.next()

    // Apply security headers
    response = applySecurityHeaders(response)

    // Validate origin (CSRF protection)
    if (!validateOrigin(request)) {
      logger.warn('Invalid origin', {
        path: pathname,
        ip: getClientIp(request),
      })
      return new NextResponse('Invalid origin', { status: 403 })
    }

    // Rate limiting for API routes
    if (pathname.startsWith('/api/')) {
      // Skip rate limiting for health check
      if (pathname === '/api/health') {
        return response
      }

      // Get rate limit identifier
      const identifier = getRateLimitIdentifier(request)

      // Determine rate limit config based on endpoint
      let rateLimitConfig
      if (pathname.includes('/auth/')) {
        rateLimitConfig = rateLimitConfigs.authEndpoint
      } else if (pathname.includes('/tools/') && (pathname.includes('/dm-intelligence') || pathname.includes('/run'))) {
        rateLimitConfig = rateLimitConfigs.aiEndpoint
      } else {
        rateLimitConfig = rateLimitConfigs.apiEndpoint
      }

      // Check rate limit
      const rateLimitResult = await checkRateLimit(identifier, rateLimitConfig)

      // Add rate limit headers
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      // Block if rate limit exceeded
      if (!rateLimitResult.success) {
        logger.rateLimit(identifier, rateLimitConfig.maxRequests, `${rateLimitConfig.windowMs}ms`, {
          path: pathname,
          ip: getClientIp(request),
        })

        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: rateLimitResult.headers['Retry-After'],
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...rateLimitResult.headers,
            },
          }
        )
      }

      // Add user ID to headers for downstream use (if authenticated)
      if (pathname.startsWith('/api/') && !pathname.includes('/auth/')) {
        try {
          const session = getSessionFromRequest(request)
          if (session) {
            response.headers.set('x-user-id', session.userId)
            // Also set on request for rate limiting
            request.headers.set('x-user-id', session.userId)
          }
        } catch (error) {
          // Session check failed, continue without user context
          logger.debug('Session check failed in middleware', { error })
        }
      }
    }

    // Log API requests
    if (pathname.startsWith('/api/')) {
      // We'll log the response status in a response interceptor or in the route handler
      // For now, just log the request
      logger.debug(`API request: ${request.method} ${pathname}`, {
        method: request.method,
        path: pathname,
        ip: getClientIp(request),
      })
    }

    return response
  } catch (error) {
    // Catch any errors in middleware to prevent crashes
    logger.error('Middleware error', error as Error, {
      path: request.nextUrl.pathname,
      method: request.method,
    })

    // Return a basic response to allow the request to continue
    // In production, you might want to return an error response
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
}
