import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint
 * Returns the health status of the application and its dependencies
 */
export async function GET() {
  const startTime = Date.now()
  const health: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    uptime: number
    version: string
    checks: {
      database: { status: 'healthy' | 'unhealthy'; latency?: number }
      memory: { status: 'healthy' | 'unhealthy'; usage?: number }
    }
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'unhealthy' },
      memory: { status: 'healthy' },
    },
  }

  // Check database connection
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStartTime
    health.checks.database = {
      status: dbLatency < 1000 ? 'healthy' : 'unhealthy',
      latency: dbLatency,
    }
  } catch (error) {
    logger.error('Database health check failed', error as Error)
    health.checks.database = { status: 'unhealthy' }
    health.status = 'unhealthy'
  }

  // Check memory usage
  try {
    const memoryUsage = process.memoryUsage()
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024
    const memoryLimitMB = (memoryUsage.heapTotal / 1024 / 1024) * 2 // Rough estimate
    const memoryUsagePercent = (memoryUsageMB / memoryLimitMB) * 100

    health.checks.memory = {
      status: memoryUsagePercent < 90 ? 'healthy' : 'unhealthy',
      usage: Math.round(memoryUsagePercent * 100) / 100,
    }

    if (memoryUsagePercent >= 90) {
      health.status = 'degraded'
    }
  } catch (error) {
    logger.error('Memory health check failed', error as Error)
    health.checks.memory = { status: 'unhealthy' }
    health.status = 'degraded'
  }

  const duration = Date.now() - startTime
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

  logger.info('Health check', {
    status: health.status,
    duration,
    checks: health.checks,
  })

  return NextResponse.json(health, { status: statusCode })
}
