import { NextResponse } from 'next/server'
import { rateLimitAdminAction, requireAdminAccess } from '@/lib/adminAuth'
import { rateLimitConfigs } from '@/lib/rate-limit'
import { createLedgerEntry, getTokenBalance } from '@/src/lib/tokens/ledger'

export async function POST(req: Request) {
  try {
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

    const admin = await requireAdminAccess(req, {
      action: 'admin.tokens.adjust',
      policy: 'admin',
      target: userId,
      meta: { tokensDelta, reason },
    })

    const rateLimit = await rateLimitAdminAction(admin, 'tokens.adjust', rateLimitConfigs.adminSensitiveAction)
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

    await createLedgerEntry({
      userId,
      eventType: 'admin_adjustment',
      tokensDelta,
      reason,
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
