import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getTokenPackById } from '@/src/lib/billing/tokenPacks'
import { getPlanById } from '@/src/lib/billing/planPrices'
import { getActiveOrg } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

const getBaseUrl = (request: NextRequest) => {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const host = request.headers.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, packId, plan } = body as {
    type: 'token_pack' | 'plan'
    packId?: string
    plan?: string
  }

  const userId = 'user_dev_1'
  const stripe = getStripe()
  const baseUrl = getBaseUrl(request)

  if (type === 'token_pack') {
    const pack = getTokenPackById(packId || '')
    if (!pack || !pack.stripePriceId) {
      return NextResponse.json({ error: 'Invalid token pack' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: pack.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId,
        purchaseType: 'token_pack',
        packId: pack.packId,
      },
      payment_intent_data: {
        metadata: {
          userId,
          purchaseType: 'token_pack',
          packId: pack.packId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  }

  const planConfig = getPlanById(plan || '')
  if (!planConfig || !planConfig.stripePriceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const activeOrg = await getActiveOrg(userId)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: {
      userId,
      purchaseType: 'plan',
      plan: planConfig.planId,
      orgId: activeOrg?.id || '',
    },
    subscription_data: {
      metadata: {
        userId,
        purchaseType: 'plan',
        plan: planConfig.planId,
        orgId: activeOrg?.id || '',
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getTokenPackById } from '@/src/lib/billing/tokenPacks'
import { getPlanById } from '@/src/lib/billing/planPrices'

export const dynamic = 'force-dynamic'

const getBaseUrl = (request: NextRequest) => {
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const host = request.headers.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { type, packId, plan } = body as {
    type: 'token_pack' | 'plan'
    packId?: string
    plan?: string
  }

  const userId = 'user_dev_1'
  const stripe = getStripe()
  const baseUrl = getBaseUrl(request)

  if (type === 'token_pack') {
    const pack = getTokenPackById(packId || '')
    if (!pack || !pack.stripePriceId) {
      return NextResponse.json({ error: 'Invalid token pack' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: pack.stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        userId,
        purchaseType: 'token_pack',
        packId: pack.packId,
      },
      payment_intent_data: {
        metadata: {
          userId,
          purchaseType: 'token_pack',
          packId: pack.packId,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  }

  const planConfig = getPlanById(plan || '')
  if (!planConfig || !planConfig.stripePriceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: {
      userId,
      purchaseType: 'plan',
      plan: planConfig.planId,
    },
    subscription_data: {
      metadata: {
        userId,
        purchaseType: 'plan',
        plan: planConfig.planId,
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
