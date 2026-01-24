import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { getGuestCookieName, signGuestToken } from '@/lib/auth'
import { sendLeadNotification } from '@/lib/email'

const bodySchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
  toolId: z.string().optional(),
})

const recognizeExpDays = 30

export async function POST(request: NextRequest) {
  const body = bodySchema.parse(await request.json())
  const { email, source, toolId } = body

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: 'Stripe not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  })

  let customerId: string | undefined
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        lead_type: 'guest',
        lead_source: source || 'tool_run_gate',
        captured_at: new Date().toISOString(),
        verified: 'false',
        tool_id: toolId || '',
      },
    })
    customerId = customer.id
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: 'Failed to store lead', details: err?.message || 'Unknown error' },
      { status: 500 }
    )
  }

  const exp = Date.now() + recognizeExpDays * 24 * 60 * 60 * 1000
  const token = signGuestToken({ email, stripeCustomerId: customerId, iat: Date.now(), exp })

  const res = NextResponse.json({ ok: true, stripeCustomerId: customerId })
  res.cookies.set(getGuestCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
    sameSite: 'lax',
    maxAge: recognizeExpDays * 24 * 60 * 60,
    path: '/',
  })

  sendLeadNotification(email, source || 'tool_run_gate').catch(() => {})
  return res
}
