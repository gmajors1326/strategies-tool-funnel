import { prisma } from '@/src/lib/prisma'

export async function dbHealthCheck(timeoutMs = 1500): Promise<{ ok: boolean; error?: string }> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB health check timed out')), timeoutMs)),
    ])
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
