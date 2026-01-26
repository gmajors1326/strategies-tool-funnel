import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getPlanByPriceId, getTokenPackByPriceId } from '@/src/lib/billing/stripeCatalog'
import { ensureStripeCustomer, getStripe } from '@/src/lib/billing/stripe'

async function createSession(
  request: NextRequest,
  params: { mode: 'subscription' | 'payment'; priceId: string; returnTo?: string }
) {
  const user = await requireUser()
  const { mode, priceId, returnTo } = params
  if (!priceId) {
    return NextResponse.json({ error: 'Missing Stripe price ID' }, { status: 400 })
  }

  const customer = await ensureStripeCustomer(user.id, user.email)
  const stripe = getStripe()

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_APP_URL
      : `${request.nextUrl.protocol}//${request.nextUrl.host}`

  const isSubscription = mode === 'subscription'
  const plan = isSubscription ? getPlanByPriceId(priceId) : null
  const pack = !isSubscription ? getTokenPackByPriceId(priceId) : null
  const planId = plan?.planId ?? null
  if (isSubscription && !plan) {
    return NextResponse.json({ error: 'Unknown subscription price ID' }, { status: 400 })
  }
  if (!isSubscription && !pack) {
    return NextResponse.json({ error: 'Unknown token pack price ID' }, { status: 400 })
  }
  const cancelUrl = returnTo && returnTo.startsWith('/') ? returnTo : `/pricing?tab=${isSubscription ? 'plans' : 'tokens'}`
  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    customer: customer.stripeCustomerId,
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}${cancelUrl}`,
    metadata: {
      userId: user.id,
      planId: planId ?? '',
      packId: pack?.packId ?? '',
      tokensGranted: pack?.tokens ? String(pack.tokens) : '',
    },
    subscription_data: isSubscription
      ? {
          metadata: { userId: user.id, planId: planId ?? '' },
        }
      : undefined,
    payment_intent_data: !isSubscription
      ? {
          metadata: { userId: user.id, tokensGranted: pack?.tokens ? String(pack.tokens) : '' },
        }
      : undefined,
    automatic_tax: process.env.STRIPE_TAX_ENABLED === 'true' ? { enabled: true } : undefined,
  })

  return NextResponse.json({ url: session.url })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const mode = body?.mode === 'payment' ? 'payment' : 'subscription'
  const priceId = String(body?.priceId || '')
  const returnTo = typeof body?.returnTo === 'string' ? body.returnTo : undefined
  return createSession(request, { mode, priceId, returnTo })
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') === 'payment' ? 'payment' : 'subscription'
  const priceId = String(request.nextUrl.searchParams.get('priceId') || '')
  const returnTo = request.nextUrl.searchParams.get('returnTo') || undefined
  return createSession(request, { mode, priceId, returnTo })
}
