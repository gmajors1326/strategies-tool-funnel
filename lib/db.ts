import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let loggedDbHost = false

// Serverless-friendly Prisma Client configuration
const createPrismaClient = () => {
  let databaseUrl = process.env.DATABASE_URL || ''
  
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

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'query' }, 'error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
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
