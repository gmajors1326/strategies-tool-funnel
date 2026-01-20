import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Serverless-friendly Prisma Client configuration
const createPrismaClient = () => {
  let databaseUrl = process.env.DATABASE_URL || ''
  
  // Clean up any trailing newlines/whitespace
  databaseUrl = databaseUrl.trim().replace(/[\r\n]+/g, '').replace(/^["']|["']$/g, '')
  
  // Add pgbouncer=true if using pooler (port 6543) and not already present
  if (databaseUrl.includes(':6543') && !databaseUrl.includes('pgbouncer=')) {
    const separator = databaseUrl.includes('?') ? '&' : '?'
    const poolLimit = process.env.DATABASE_POOL_SIZE || '1'
    databaseUrl += `${separator}pgbouncer=true&connection_limit=${poolLimit}`
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
