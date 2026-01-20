import { logger } from './logger'

interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  del(key: string): Promise<void>
}

class MemoryCache implements CacheStore {
  private store = new Map<string, { value: string; expiresAt: number }>()

  constructor() {
    setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt <= now) {
          this.store.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
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

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cacheStore.get(key)
  if (cached) {
    try {
      return JSON.parse(cached) as T
    } catch (error) {
      logger.warn('Cache parse failed, refetching', { key })
      await cacheStore.del(key)
    }
  }

  const fresh = await fetcher()
  try {
    await cacheStore.set(key, JSON.stringify(fresh), ttlSeconds)
  } catch (error) {
    logger.error('Cache write failed', error as Error, { key })
  }

  return fresh
}
