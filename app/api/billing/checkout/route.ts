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
  const planId = 'planId' in sku ? sku.planId : null
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
      planId,
    },
    subscription_data: isSubscription
      ? {
          metadata: { userId: user.id, sku: sku.id, planId: planId ?? '' },
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
