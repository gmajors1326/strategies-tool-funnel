import { NextResponse } from 'next/server'
import { rateLimitAdminAction, requireAdminAccess } from '@/lib/adminAuth'
import { rateLimitConfigs } from '@/lib/rate-limit'
import { grantBonusRuns } from '@/src/lib/tool/bonusRuns'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const userId = String(body.userId || '')
    const toolId = body.toolId == null ? null : String(body.toolId)
    const runsGranted = Number(body.runsGranted)
    const reason = body.reason != null ? String(body.reason).slice(0, 500) : undefined
    const expiresAt = body.expiresAt != null ? new Date(String(body.expiresAt)) : undefined

    if (!userId) {
      return NextResponse.json({ error: { message: 'userId is required' } }, { status: 400 })
    }
    if (!Number.isInteger(runsGranted) || runsGranted <= 0) {
      return NextResponse.json({ error: { message: 'runsGranted must be a positive integer' } }, { status: 400 })
    }
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: { message: 'expiresAt must be a valid ISO date string' } }, { status: 400 })
    }

    const admin = await requireAdminAccess(req, {
      action: 'admin.bonus_runs.grant',
      policy: 'admin',
      target: userId,
      meta: {
        toolId,
        runsGranted,
        reason,
        expiresAt: expiresAt?.toISOString?.() ?? null,
      },
    })

    const rateLimit = await rateLimitAdminAction(admin, 'bonus_runs.grant', rateLimitConfigs.adminAction)
    if (!rateLimit.success) {
      const headers = new Headers()
      Object.entries(rateLimit.headers).forEach(([key, value]) => {
        if (value) headers.set(key, value)
      })
      return NextResponse.json(
        { error: { message: 'Rate limit exceeded' } },
        { status: 429, headers }
      )
    }

    const row = await grantBonusRuns({
      userId,
      toolId,
      runsGranted,
      reason,
      expiresAt: expiresAt ?? null,
      grantedBy: admin.userId,
    })

    return NextResponse.json({ ok: true, bonus: row })
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500
    return NextResponse.json(
      { ok: false, error: { message } },
      { status }
    )
  }
}
