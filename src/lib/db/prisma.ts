import { PrismaClient } from '@/src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ''
let allowSelfSigned = false
try {
  const parsed = new URL(connectionString)
  allowSelfSigned = parsed.hostname.includes('supabase.')
} catch {
  allowSelfSigned = false
}
if (process.env.DATABASE_SSL_ALLOW_SELF_SIGNED === 'true') {
  allowSelfSigned = true
}
const adapter = new PrismaPg({
  connectionString,
  ...(allowSelfSigned ? { ssl: { rejectUnauthorized: false } } : {}),
})

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
