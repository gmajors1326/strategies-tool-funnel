import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/src/lib/prisma'
import { getStripe } from '@/src/lib/billing/stripe'
import { getSkuByPriceId, getSku } from '@/src/lib/billing/skus'

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

async function handleTokenPurchase(userId: string, skuId: string, paymentIntentId?: string | null) {
  const sku = getSku(skuId)
  if (!sku || !('tokensGranted' in sku)) return
  const tokensGranted = typeof sku.tokensGranted === 'number' ? sku.tokensGranted : 0
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
  const sku = priceId ? getSkuByPriceId(priceId) : null
  const userId = subscription.metadata?.userId || (await resolveUserIdFromCustomer(subscription.customer as string))
  if (!userId || !sku || !('planId' in sku)) return

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
    await upsertEntitlementPlan(userId, sku.planId)
  } else if (INACTIVE_STATUSES.has(subscription.status)) {
    await upsertEntitlementPlan(userId, 'free')
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
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    const stripe = getStripe()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const skuId = session.metadata?.sku || ''
      const userId = session.metadata?.userId || (await resolveUserIdFromCustomer(session.customer as string))
      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null

      if (userId && skuId) {
        await recordPurchase(userId, skuId, session.id, paymentIntentId)
      }

      if (session.mode === 'payment' && userId && skuId) {
        await handleTokenPurchase(userId, skuId, paymentIntentId)
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      await updateSubscriptionFromStripe(event.data.object as Stripe.Subscription)
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await updateSubscriptionFromStripe(subscription)
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

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string | null
      if (paymentIntentId) {
        const purchase = await prisma.purchase.findUnique({
          where: { stripePaymentIntentId: paymentIntentId },
        })
        if (purchase) {
          const sku = getSku(purchase.sku)
          if (sku && 'tokensGranted' in sku) {
            const tokensGranted = typeof sku.tokensGranted === 'number' ? sku.tokensGranted : 0
            await prisma.tokenLedger.create({
              data: {
                user_id: purchase.userId,
                event_type: 'refund',
                tokens_delta: -tokensGranted,
                reason: 'refund',
                stripe_payment_intent_id: paymentIntentId,
              },
            })
          }
          await prisma.purchase.update({
            where: { stripePaymentIntentId: paymentIntentId },
            data: { status: 'refunded' },
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
