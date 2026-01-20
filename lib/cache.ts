import { logger } from './logger'

interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

type CacheEnvelope = {
  value: string
  expiresAt: number
  staleUntil: number
}

class MemoryCache implements CacheStore {
  private store = new Map<string, CacheEnvelope>()

  constructor() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (entry.staleUntil <= now) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    return JSON.stringify(entry)
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      const envelope = JSON.parse(value) as CacheEnvelope
      this.store.set(key, envelope)
    } catch {
      const now = Date.now()
      const envelope: CacheEnvelope = {
        value,
        expiresAt: now + ttlSeconds * 1000,
        staleUntil: now + ttlSeconds * 1000,
      }
      this.store.set(key, envelope)
    }
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
}

class RedisCache implements CacheStore {
  private redisUrl: string
  private redisToken?: string

  constructor() {
    this.redisUrl = process.env.REDIS_URL || ''
    this.redisToken = process.env.REDIS_TOKEN
  }

  private async fetchRedis(command: string, ...args: string[]): Promise<unknown> {
    if (!this.redisUrl) {
      throw new Error('Redis not configured')
    }

    const url = `${this.redisUrl}/${command}/${args.map(encodeURIComponent).join('/')}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.redisToken) {
      headers['Authorization'] = `Bearer ${this.redisToken}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Redis request failed: ${response.statusText}`)
    }

    return response.json()
  }

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.fetchRedis('GET', key) as { result: string | null }
      return result.result ?? null
    } catch (error) {
      logger.error('Redis cache GET failed', error as Error)
      return null
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.fetchRedis('SET', key, value)
      await this.fetchRedis('EXPIRE', key, ttlSeconds.toString())
    } catch (error) {
      logger.error('Redis cache SET failed', error as Error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.fetchRedis('DEL', key)
    } catch (error) {
      logger.error('Redis cache DEL failed', error as Error)
    }
  }
}

const createCacheStore = (): CacheStore => {
  const useRedis = !!process.env.REDIS_URL && process.env.NODE_ENV === 'production'
  return useRedis ? new RedisCache() : new MemoryCache()
}

const cacheStore = createCacheStore()
const inFlight = new Map<string, Promise<unknown>>()

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  staleSeconds: number = ttlSeconds
): Promise<T> {
  const cached = await cacheStore.get(key)
  if (cached) {
    try {
      const envelope = JSON.parse(cached) as CacheEnvelope
      const now = Date.now()
      const value = JSON.parse(envelope.value) as T

      if (envelope.expiresAt > now) {
        return value
      }

      if (envelope.staleUntil > now) {
        if (!inFlight.has(key)) {
          const refresh = fetcher()
            .then(async (fresh) => {
              const payload = JSON.stringify(fresh)
              const newEnvelope: CacheEnvelope = {
                value: payload,
                expiresAt: Date.now() + ttlSeconds * 1000,
                staleUntil: Date.now() + (ttlSeconds + staleSeconds) * 1000,
              }
              await cacheStore.set(key, JSON.stringify(newEnvelope), ttlSeconds + staleSeconds)
              return fresh
            })
            .catch((error) => {
              logger.error('Cache refresh failed', error as Error, { key })
              return value
            })
            .finally(() => {
              inFlight.delete(key)
            })
          inFlight.set(key, refresh)
        }

        return value
      }
    } catch (error) {
      logger.warn('Cache parse failed, refetching', { key })
      await cacheStore.del(key)
    }
  }

  if (inFlight.has(key)) {
    return (await inFlight.get(key)) as T
  }

  const fetchPromise = fetcher()
    .then(async (fresh) => {
      const payload = JSON.stringify(fresh)
      const envelope: CacheEnvelope = {
        value: payload,
        expiresAt: Date.now() + ttlSeconds * 1000,
        staleUntil: Date.now() + (ttlSeconds + staleSeconds) * 1000,
      }
      await cacheStore.set(key, JSON.stringify(envelope), ttlSeconds + staleSeconds)
      return fresh
    })
    .catch((error) => {
      logger.error('Cache write failed', error as Error, { key })
      throw error
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, fetchPromise)
  return (await fetchPromise) as T
}
