import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { createLedgerEntry, getTokenBalance } from '@/src/lib/tokens/ledger'
import { logAdminAudit } from '@/src/lib/admin/audit'

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const userId = String(body.userId || '')
    const tokensDelta = Number(body.tokensDelta)
    const reason = body.reason != null ? String(body.reason).slice(0, 500) : null

    if (!userId) {
      return NextResponse.json({ error: { message: 'userId is required' } }, { status: 400 })
    }
    if (!Number.isInteger(tokensDelta) || tokensDelta === 0) {
      return NextResponse.json({ error: { message: 'tokensDelta must be a non-zero integer' } }, { status: 400 })
    }

    await createLedgerEntry({
      userId,
      eventType: 'admin_adjustment',
      tokensDelta,
      reason,
    })

    await logAdminAudit({
      actorId: admin.userId,
      actorEmail: admin.email,
      action: 'admin.tokens.adjust',
      target: userId,
      meta: { tokensDelta, reason },
    })

    const balance = await getTokenBalance(userId)
    return NextResponse.json({ ok: true, balance })
  } catch (err: any) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const status = message.includes('Unauthorized') ? 401 : message.includes('Forbidden') ? 403 : 500
    return NextResponse.json(
      { ok: false, error: { message } },
      { status }
    )
  }
}
