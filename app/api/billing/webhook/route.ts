import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/src/lib/prisma'
import { getTokenPackById, getTokenPackByPriceId } from '@/src/lib/billing/tokenPacks'
import { getPlanByPriceId } from '@/src/lib/billing/planPrices'
import { logAudit } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

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
    await prisma.stripeEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
      },
    })
  } catch {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    const stripe = getStripe()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const purchaseType = session.metadata?.purchaseType

      if (purchaseType === 'token_pack') {
        const expanded = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items'],
        })
        const priceId = expanded.line_items?.data?.[0]?.price?.id
        const pack = priceId ? getTokenPackByPriceId(priceId) : null
        const userId = session.metadata?.userId

        if (userId && pack) {
          await prisma.tokenLedger.create({
            data: {
              user_id: userId,
              event_type: 'purchase_pack',
              tokens_delta: pack.tokensGranted,
              tool_id: pack.packId,
              reason: `stripe_session:${session.id}`,
            },
          })
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string | null
      const subscription = subscriptionId
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : null
      const userId = subscription?.metadata?.userId || invoice.metadata?.userId
      const planId = subscription?.metadata?.plan || invoice.metadata?.plan
      const priceId = invoice.lines.data[0]?.price?.id
      const plan = planId ? { planId } : priceId ? getPlanByPriceId(priceId) : null
      const orgId = subscription?.metadata?.orgId || invoice.metadata?.orgId

      if (userId && plan) {
        const mappedPlan = plan.planId === 'business' ? 'team' : 'pro_monthly'
        await prisma.entitlement.upsert({
          where: { userId },
          update: { plan: mappedPlan },
          create: {
            userId,
            plan: mappedPlan,
            resetsAt: new Date(),
          },
        })
      }

      if (orgId && plan) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: plan.planId,
            stripeSubscriptionId: subscriptionId || undefined,
            stripeCustomerId: invoice.customer as string,
          },
        })
        await logAudit({ orgId, action: 'billing_plan_changed', meta: { plan: plan.planId } })
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      const orgId = subscription.metadata?.orgId
      const plan = subscription.metadata?.plan
      if (orgId && plan) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
          },
        })
        await logAudit({ orgId, action: 'billing_plan_changed', meta: { plan } })
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      const orgId = subscription.metadata?.orgId
      if (orgId) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan: 'business',
            stripeSubscriptionId: null,
          },
        })
        await logAudit({ orgId, action: 'billing_subscription_deleted', meta: { subId: subscription.id } })
      }
    }

    if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
      const charge = event.data.object as Stripe.Charge
      const userId = charge.metadata?.userId
      const packId = charge.metadata?.packId
      const pack = packId ? getTokenPackById(packId) : null

      if (userId && pack) {
        await prisma.tokenLedger.create({
          data: {
            userId,
            eventType: 'reversal',
            tokensDelta: -pack.tokensGranted,
            toolId: pack.packId,
            reason: `stripe_charge:${charge.id}`,
          },
        })
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
