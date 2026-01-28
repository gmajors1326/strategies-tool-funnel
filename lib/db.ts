import { PrismaClient } from '@/src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let loggedDbHost = false

// Serverless-friendly Prisma Client configuration
const createPrismaClient = () => {
  let databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  
  // Clean up any trailing newlines/whitespace
  databaseUrl = databaseUrl.trim().replace(/[\r\n]+/g, '').replace(/^["']|["']$/g, '')
  
  // Add pooler-safe params when using port 6543
  if (databaseUrl.includes(':6543')) {
    const separator = databaseUrl.includes('?') ? '&' : '?'
    const poolLimit = process.env.DATABASE_POOL_SIZE || '1'
    if (!databaseUrl.includes('pgbouncer=')) {
      databaseUrl += `${separator}pgbouncer=true&connection_limit=${poolLimit}`
    }
    if (!databaseUrl.includes('sslmode=')) {
      databaseUrl += `${databaseUrl.includes('?') ? '&' : '?'}sslmode=require`
    }
  }

  if (!loggedDbHost) {
    loggedDbHost = true
    try {
      const parsed = new URL(databaseUrl)
      const isPooler = parsed.port === '6543'
      logger.info('Database connection target', {
        host: parsed.hostname,
        port: parsed.port || '5432',
        isPooler,
        hasPgbouncer: parsed.searchParams.has('pgbouncer'),
      })
    } catch {
      logger.warn('Database connection target unavailable')
    }
  }

  let allowSelfSigned = false
  try {
    const parsed = new URL(databaseUrl)
    allowSelfSigned = parsed.hostname.includes('supabase.')
  } catch {
    allowSelfSigned = false
  }
  if (process.env.DATABASE_SSL_ALLOW_SELF_SIGNED === 'true') {
    allowSelfSigned = true
  }

  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    ...(allowSelfSigned ? { ssl: { rejectUnauthorized: false } } : {}),
  })
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'query' }, 'error', 'warn']
      : ['error'],
  })

  if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (event) => {
      logger.dbQuery(event.query, event.duration, {
        params: event.params,
        target: event.target,
      })
    })
  }

  return prisma
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
