import { PrismaClient } from '@/src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || '' }),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma
