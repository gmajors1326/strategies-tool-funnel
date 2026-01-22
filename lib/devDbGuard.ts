import { prisma } from '@/lib/db'

const DEV_DB_READY_CACHE_MS = 5000
let lastCheckAt = 0
let lastCheckOk = false

export async function ensureDevDbReady() {
  if (process.env.NODE_ENV === 'production') return

  const now = Date.now()
  if (now - lastCheckAt < DEV_DB_READY_CACHE_MS) {
    if (!lastCheckOk) {
      throw new Error('Database not ready (dev). Check DATABASE_URL and run migrations.')
    }
    return
  }

  lastCheckAt = now

  if (!process.env.DATABASE_URL?.trim()) {
    lastCheckOk = false
    throw new Error('Database not configured (dev). Set DATABASE_URL and run migrations.')
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    lastCheckOk = true
  } catch {
    lastCheckOk = false
    throw new Error('Database not ready (dev). Check DATABASE_URL and run migrations.')
  }
}
