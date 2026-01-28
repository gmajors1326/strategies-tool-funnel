import { PrismaClient } from '@/src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

const rawUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ''
let allowSelfSigned = false
try {
  const parsed = new URL(rawUrl)
  allowSelfSigned = parsed.hostname.includes('supabase.')
} catch {
  allowSelfSigned = false
}
if (process.env.DATABASE_SSL_ALLOW_SELF_SIGNED === 'true') {
  allowSelfSigned = true
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: rawUrl,
      ...(allowSelfSigned ? { ssl: { rejectUnauthorized: false } } : {}),
    }),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma
