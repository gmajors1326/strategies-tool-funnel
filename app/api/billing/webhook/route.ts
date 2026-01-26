import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/src/lib/prisma'
import { getStripe } from '@/src/lib/billing/stripe'
import { getPlanByPriceId } from '@/src/lib/billing/stripeCatalog'

export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

const ACTIVE_STATUSES = new Set(['active', 'trialing'])
const INACTIVE_STATUSES = new Set(['canceled', 'unpaid', 'incomplete_expired'])

async function resolveUserIdFromCustomer(customerId?: string | null) {
  if (!customerId) return null
  const record = await prisma.billingCustomer.findUnique({
    where: { stripeCustomerId: customerId },
  })
  return record?.userId ?? null
}

async function upsertEntitlementPlan(userId: string, planId: string) {
  await prisma.entitlement.upsert({
    where: { user_id: userId },
    update: { plan: planId },
    create: { user_id: userId, plan: planId, resets_at: new Date() },
  })
  await prisma.adminAuditLog.create({
    data: {
      actorId: userId,
      action: 'billing_plan_updated',
      meta: { planId },
    },
  })
}

async function handleTokenPurchase(userId: string, tokensGranted: number, paymentIntentId?: string | null) {
  try {
    await prisma.tokenLedger.create({
      data: {
        user_id: userId,
        event_type: 'purchase',
        tokens_delta: tokensGranted,
        reason: 'purchase',
        stripe_payment_intent_id: paymentIntentId || undefined,
      },
    })
  } catch {
    // idempotent: ignore duplicates
  }
}

async function recordPurchase(userId: string, sku: string, sessionId: string, paymentIntentId?: string | null) {
  await prisma.purchase.upsert({
    where: { stripeCheckoutSessionId: sessionId },
    update: {
      sku,
      stripePaymentIntentId: paymentIntentId || undefined,
      status: paymentIntentId ? 'paid' : 'pending',
    },
    create: {
      userId,
      sku,
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: paymentIntentId || undefined,
      status: paymentIntentId ? 'paid' : 'pending',
    },
  })
}

async function updateSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price?.id
  const plan = priceId ? getPlanByPriceId(priceId) : null
  const userId = subscription.metadata?.userId || (await resolveUserIdFromCustomer(subscription.customer as string))
  if (!userId || !plan) return

  await prisma.billingSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      stripePriceId: priceId || '',
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId || '',
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    },
  })

  if (ACTIVE_STATUSES.has(subscription.status)) {
    await upsertEntitlementPlan(userId, plan.planId)
  } else if (INACTIVE_STATUSES.has(subscription.status)) {
    await upsertEntitlementPlan(userId, 'free')
  }
}

async function updateCustomerMetadata(customerId: string, metadata: Record<string, string>) {
  try {
    await getStripe().customers.update(customerId, { metadata })
  } catch {
    // ignore stripe metadata failures
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!WEBHOOK_SECRET || !signature) {
    return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await prisma.billingEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payloadJson: event as any,
      },
    })
  } catch {
    // ignore duplicate or DB unavailable
  }

  const stripe = getStripe()

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId || (await resolveUserIdFromCustomer(session.customer as string))
      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null
      const tokensGranted = Number(session.metadata?.tokensGranted || 0)
      const planId = session.metadata?.planId || ''

      if (userId) {
        await recordPurchase(userId, planId || `tokens_${session.metadata?.packId || 'pack'}`, session.id, paymentIntentId)
        if (session.mode === 'payment' && tokensGranted) {
          await handleTokenPurchase(userId, tokensGranted, paymentIntentId)
        }
      }
      if (session.customer) {
        await updateCustomerMetadata(session.customer as string, {
          plan: planId || '',
          plan_active: session.mode === 'subscription' ? 'true' : '',
          bonus_tokens_add: tokensGranted ? String(tokensGranted) : '',
          last_purchase_at: new Date().toISOString(),
        })
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      await updateSubscriptionFromStripe(subscription)
      const priceId = subscription.items.data[0]?.price?.id || ''
      const plan = priceId ? getPlanByPriceId(priceId) : null
      if (plan && subscription.customer) {
        await updateCustomerMetadata(subscription.customer as string, {
          plan: plan.planId,
          plan_active: ACTIVE_STATUSES.has(subscription.status) ? 'true' : 'false',
          last_purchase_at: new Date().toISOString(),
        })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await updateSubscriptionFromStripe(subscription)
      if (subscription.customer) {
        await updateCustomerMetadata(subscription.customer as string, {
          plan: 'free',
          plan_active: 'false',
          last_purchase_at: new Date().toISOString(),
        })
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string | null
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await updateSubscriptionFromStripe(subscription)
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string | null
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        await prisma.billingSubscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: subscription.status },
        })
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const tokensGranted = Number(paymentIntent.metadata?.tokensGranted || 0)
      if (tokensGranted && paymentIntent.customer) {
        await updateCustomerMetadata(paymentIntent.customer as string, {
          bonus_tokens_add: String(tokensGranted),
          last_purchase_at: new Date().toISOString(),
        })
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string | null
      if (paymentIntentId) {
        await prisma.purchase.updateMany({
          where: { stripePaymentIntentId: paymentIntentId },
          data: { status: 'refunded' },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // DB fallback: update Stripe metadata to avoid retries
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.customer) {
          await updateCustomerMetadata(session.customer as string, {
            plan: session.metadata?.planId || '',
            plan_active: session.mode === 'subscription' ? 'true' : '',
            bonus_tokens_add: session.metadata?.tokensGranted || '',
            last_purchase_at: new Date().toISOString(),
          })
        }
      }
      if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price?.id || ''
        const plan = priceId ? getPlanByPriceId(priceId) : null
        if (plan && subscription.customer) {
          await updateCustomerMetadata(subscription.customer as string, {
            plan: plan.planId,
            plan_active: ACTIVE_STATUSES.has(subscription.status) ? 'true' : 'false',
            last_purchase_at: new Date().toISOString(),
          })
        }
      }
    } catch {
      // ignore fallback failures
    }

    return NextResponse.json({ received: true, degraded: true })
  }
}
