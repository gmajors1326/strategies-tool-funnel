import { NextResponse } from 'next/server'
import { createLedgerEntry, getTokenBalance } from '@/src/lib/tokens/ledger'

async function getAuthedAdminId(req: Request): Promise<string> {
  const devHeader = req.headers.get('x-admin-id')
  if (process.env.NODE_ENV === 'development' && devHeader) return devHeader
  throw new Error('Unauthorized: missing admin auth integration for getAuthedAdminId()')
}

export async function POST(req: Request) {
  try {
    await getAuthedAdminId(req)
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

    const balance = await getTokenBalance(userId)
    return NextResponse.json({ ok: true, balance })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: { message: err?.message || 'Unknown error' } },
      { status: err?.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
