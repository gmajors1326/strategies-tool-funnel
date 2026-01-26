import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSessionCookie, verifyMagicLinkToken } from '@/lib/auth'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL(`/verify?error=invalid_link`, request.url))
  }

  const payload = verifyMagicLinkToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL(`/verify?error=expired`, request.url))
  }

  const email = payload.email
  const safeNext = '/'

  let sessionUserId = `email:${email}`
  let sessionPlan = 'free'

  try {
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      user = await prisma.user.create({ data: { email, name: payload.name } })
    }

    if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      })
    }

    sessionUserId = user.id
    sessionPlan = user.plan
  } catch {
    return NextResponse.redirect(new URL(`/verify?error=db_unavailable`, request.url))
  }

  if (payload.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
        typescript: true,
      })
      await stripe.customers.update(payload.stripeCustomerId, {
        metadata: {
          verified: 'true',
          verified_at: new Date().toISOString(),
        },
      })
    } catch {
      // ignore
    }
  }

  const res = NextResponse.redirect(new URL(safeNext, request.url))
  const sessionCookie = await createSessionCookie(sessionUserId, email, sessionPlan)
  res.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)
  return res
}
