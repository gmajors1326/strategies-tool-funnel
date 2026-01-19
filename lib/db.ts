import { PrismaClient } from '@prisma/client'

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
    databaseUrl += `${separator}pgbouncer=true&connection_limit=1`
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
