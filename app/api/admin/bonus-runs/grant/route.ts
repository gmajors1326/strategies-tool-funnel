import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { grantBonusRuns } from '@/src/lib/tool/bonusRuns'
import { logAdminAudit } from '@/src/lib/admin/audit'

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
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

    const row = await grantBonusRuns({
      userId,
      toolId,
      runsGranted,
      reason,
      expiresAt: expiresAt ?? null,
      grantedBy: admin.userId,
    })

    await logAdminAudit({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: 'admin.bonus_runs.grant',
      target: userId,
      meta: {
        toolId,
        runsGranted,
        reason,
        expiresAt: expiresAt?.toISOString?.() ?? null,
      },
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
