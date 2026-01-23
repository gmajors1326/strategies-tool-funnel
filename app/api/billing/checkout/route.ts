import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getSku } from '@/src/lib/billing/skus'
import { ensureStripeCustomer, getStripe } from '@/src/lib/billing/stripe'

async function createSession(request: NextRequest, skuId: string) {
  const user = await requireUser()
  const sku = getSku(skuId)
  if (!sku) {
    return NextResponse.json({ error: 'Invalid sku' }, { status: 400 })
  }

  if (!sku.stripePriceId) {
    return NextResponse.json({ error: 'Missing Stripe price ID' }, { status: 400 })
  }

  const customer = await ensureStripeCustomer(user.id, user.email)
  const stripe = getStripe()

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_APP_URL
      : `${request.nextUrl.protocol}//${request.nextUrl.host}`

  const isSubscription = sku.mode === 'subscription'
  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    customer: customer.stripeCustomerId,
    allow_promotion_codes: true,
    line_items: [{ price: sku.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?tab=${sku.id.startsWith('tokens_') ? 'tokens' : 'plans'}`,
    metadata: {
      userId: user.id,
      sku: sku.id,
      planId: 'planId' in sku ? sku.planId : undefined,
    },
    subscription_data: isSubscription
      ? {
          metadata: { userId: user.id, sku: sku.id, planId: 'planId' in sku ? sku.planId : '' },
        }
      : undefined,
    payment_intent_data: !isSubscription
      ? {
          metadata: { userId: user.id, sku: sku.id },
        }
      : undefined,
    automatic_tax: process.env.STRIPE_TAX_ENABLED === 'true' ? { enabled: true } : undefined,
  })

  return NextResponse.json({ url: session.url })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const skuId = String(body?.sku || '')
  return createSession(request, skuId)
}

export async function GET(request: NextRequest) {
  const skuId = String(request.nextUrl.searchParams.get('sku') || '')
  return createSession(request, skuId)
}
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

  // TODO: replace (auth): derive user ID from authenticated session.
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
