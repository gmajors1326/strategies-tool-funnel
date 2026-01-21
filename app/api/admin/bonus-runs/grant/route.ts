import { NextResponse } from 'next/server'
import { grantBonusRuns } from '@/src/lib/tool/bonusRuns'

async function getAuthedAdminId(req: Request): Promise<string> {
  // TODO: replace (auth): verify admin identity via real auth/session middleware.
  const devHeader = req.headers.get('x-admin-id')
  if (process.env.NODE_ENV === 'development' && devHeader) return devHeader
  throw new Error('Unauthorized: missing admin auth integration for getAuthedAdminId()')
}

export async function POST(req: Request) {
  try {
    const adminId = await getAuthedAdminId(req)
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
      grantedBy: adminId,
    })

    return NextResponse.json({ ok: true, bonus: row })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: { message: err?.message || 'Unknown error' } },
      { status: err?.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
