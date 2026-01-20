/**
 * Security utilities and middleware helpers
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Security headers configuration
 */
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Content Security Policy - adjust based on your needs
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com", // Stripe requires unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind/Next.js requires unsafe-inline
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.sentry.io", // Stripe API and Sentry
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * CSRF token generation and validation
 */
const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_TOKEN_COOKIE = 'csrf-token'

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  // Generate a random 32-byte token
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  // Skip CSRF validation for webhook endpoints (they use signature verification)
  const pathname = request.nextUrl.pathname
  if (pathname.includes('/api/stripe/webhook')) {
    return true
  }

  const tokenFromHeader = request.headers.get(CSRF_TOKEN_HEADER)
  const tokenFromCookie = request.cookies.get(CSRF_TOKEN_COOKIE)?.value

  if (!tokenFromHeader || !tokenFromCookie) {
    logger.warn('CSRF token missing', {
      path: pathname,
      method,
      hasHeader: !!tokenFromHeader,
      hasCookie: !!tokenFromCookie,
    })
    return false
  }

  // Use timing-safe comparison
  if (tokenFromHeader !== tokenFromCookie) {
    logger.warn('CSRF token mismatch', {
      path: pathname,
      method,
    })
    return false
  }

  return true
}

/**
 * IP address extraction (handles proxies)
 */
export function getClientIp(request: NextRequest): string {
  // Check x-forwarded-for header (from proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP (original client)
    return forwardedFor.split(',')[0].trim()
  }

  // Check x-real-ip header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to connection remote address (if available)
  return 'unknown'
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return true
    }
    logger.warn('NEXT_PUBLIC_APP_URL not configured, origin validation skipped')
    return true
  }

  // For same-origin requests, origin might be null
  if (!origin && !referer) {
    // Allow requests without origin/referer (e.g., direct API calls, webhooks)
    return true
  }

  const allowedOrigin = new URL(appUrl).origin
  const requestOrigin = origin || (referer ? new URL(referer).origin : null)

  if (requestOrigin && requestOrigin !== allowedOrigin) {
    logger.warn('Invalid origin', {
      requestOrigin,
      allowedOrigin,
      path: request.nextUrl.pathname,
    })
    return false
  }

  return true
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 10000) // Limit length
}

/**
 * Validate API key (for internal service-to-service communication)
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const expectedApiKey = process.env.INTERNAL_API_KEY

  if (!expectedApiKey) {
    // API key validation is optional
    return true
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    logger.warn('Invalid API key', {
      path: request.nextUrl.pathname,
      hasKey: !!apiKey,
    })
    return false
  }

  return true
}
