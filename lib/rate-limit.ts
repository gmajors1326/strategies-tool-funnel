/**
 * Rate limiting implementation
 * Uses in-memory store for development, Redis for production
 */

import { logger } from './logger'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: Request) => string // Custom key generator
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RateLimitStore {
  get(key: string): Promise<number | null>
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>
  reset(key: string): Promise<void>
}

// TODO: replace (usage): use persistent rate limit store in all environments.
// In-memory store for development/testing
class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.resetTime < Date.now()) {
      this.store.delete(key)
      return null
    }

    return entry.count
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || entry.resetTime < now) {
      const resetTime = now + windowMs
      this.store.set(key, { count: 1, resetTime })
      return { count: 1, resetTime }
    }

    entry.count++
    return { count: entry.count, resetTime: entry.resetTime }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  destroy() {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Redis store for production (using Upstash Redis or similar)
class RedisStore implements RateLimitStore {
  private redisUrl: string
  private redisToken?: string

  constructor() {
    this.redisUrl = process.env.REDIS_URL || ''
    this.redisToken = process.env.REDIS_TOKEN

    if (!this.redisUrl && process.env.NODE_ENV === 'production') {
      logger.warn('Redis URL not configured. Falling back to memory store.')
    }
  }

  private async fetchRedis(command: string, ...args: string[]): Promise<unknown> {
    if (!this.redisUrl) {
      throw new Error('Redis not configured')
    }

    const url = `${this.redisUrl}/${command}/${args.join('/')}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.redisToken) {
      headers['Authorization'] = `Bearer ${this.redisToken}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      // Don't cache Redis requests
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async get(key: string): Promise<number | null> {
    try {
      const result = await this.fetchRedis('GET', key) as { result: string | null }
      return result.result ? parseInt(result.result, 10) : null
    } catch (error) {
      logger.error('Redis GET failed', error as Error)
      return null
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    try {
      const now = Date.now()
      const resetTime = now + windowMs
      const ttl = Math.ceil(windowMs / 1000) // Convert to seconds

      // Use Redis INCR with EXPIRE
      const result = await this.fetchRedis('INCR', key) as { result: number }
      await this.fetchRedis('EXPIRE', key, ttl.toString())

      return { count: result.result, resetTime }
    } catch (error) {
      logger.error('Redis INCR failed', error as Error)
      // Fallback: return a safe default
      return { count: 1, resetTime: Date.now() + windowMs }
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.fetchRedis('DEL', key)
    } catch (error) {
      logger.error('Redis DEL failed', error as Error)
    }
  }
}

// Create store instance
const createStore = (): RateLimitStore => {
  // TODO: replace (usage): remove in-memory fallback for production traffic.
  const useRedis = process.env.REDIS_URL && process.env.NODE_ENV === 'production'
  return useRedis ? new RedisStore() : new MemoryStore()
}

const store = createStore()

// Rate limit response headers
interface RateLimitHeaders {
  'X-RateLimit-Limit': string
  'X-RateLimit-Remaining': string
  'X-RateLimit-Reset': string
  'Retry-After'?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  headers: RateLimitHeaders
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, maxRequests } = config
  const key = `rate_limit:${identifier}`

  try {
    const result = await store.increment(key, windowMs)
    const { count, resetTime } = result

    const remaining = Math.max(0, maxRequests - count)
    const success = count <= maxRequests

    const headers: RateLimitHeaders = {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
    }

    if (!success) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      headers['Retry-After'] = retryAfter.toString()

      logger.rateLimit(identifier, maxRequests, `${windowMs}ms`, {
        count,
        remaining,
        resetTime: new Date(resetTime).toISOString(),
      })
    }

    return {
      success,
      limit: maxRequests,
      remaining,
      resetTime,
      headers,
    }
  } catch (error) {
    logger.error('Rate limit check failed', error as Error, { identifier })
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs,
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': maxRequests.toString(),
        'X-RateLimit-Reset': Math.ceil((Date.now() + windowMs) / 1000).toString(),
      },
    }
  }
}

/**
 * Generate rate limit identifier from request
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get user ID from session first
  // This will be set by auth middleware
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit configuration presets
 */
export const rateLimitConfigs = {
  // Strict rate limit for AI endpoints
  aiEndpoint: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },

  // Moderate rate limit for general API endpoints
  apiEndpoint: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },

  // Strict rate limit for authentication endpoints
  authEndpoint: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },

  // Rate limit for admin actions
  adminAction: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 actions per minute
  },

  // Stricter rate limit for sensitive admin actions
  adminSensitiveAction: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 actions per minute
  },

  // Rate limit for OTP requests (already implemented, but can use this)
  otpRequest: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1, // 1 request per minute
  },
}
