import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { grantEntitlement } from '@/lib/entitlements'
import { prisma } from '@/lib/db'
import { Plan } from '@prisma/client'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event | null = null
  let matchedSecretId: string | null = null

  const tryConstruct = (secret: string): Stripe.Event | null => {
    try {
      return getStripe().webhooks.constructEvent(body, signature, secret)
    } catch {
      return null
    }
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (webhookSecret) {
    event = tryConstruct(webhookSecret)
  }

  if (!event) {
    const secrets = await prisma.webhookSecret.findMany({
      where: { active: true },
      select: { id: true, secret: true },
    })

    for (const secret of secrets) {
      const parsed = tryConstruct(secret.secret)
      if (parsed) {
        event = parsed
        matchedSecretId = secret.id
        break
      }
    }
  }

  if (!event) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    const eventCustomerId = (event.data?.object as { customer?: string } | undefined)?.customer

    const existing = await prisma.webhookDelivery.findUnique({
      where: { eventId: event.id },
    })

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true })
    }

    const delivery = await prisma.webhookDelivery.create({
      data: {
        eventId: event.id,
        type: event.type,
        customerId: eventCustomerId ?? null,
        status: 'received',
      },
    })

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id || session.metadata?.userId
      const planId = session.metadata?.planId

      if (!userId || !planId) {
        console.error('Missing userId or planId in session metadata')
        return NextResponse.json(
          { error: 'Missing metadata' },
          { status: 400 }
        )
      }

      // Map planId to Plan enum
      const planMap: Record<string, Plan> = {
        dm_engine: Plan.DM_ENGINE,
        the_strategy: Plan.THE_STRATEGY,
        all_access: Plan.ALL_ACCESS,
      }

      const plan = planMap[planId]
      if (!plan) {
        console.error('Invalid plan ID:', planId)
        return NextResponse.json(
          { error: 'Invalid plan' },
          { status: 400 }
        )
      }

      await grantEntitlement(userId, plan)
    }

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    })

    if (matchedSecretId) {
      await prisma.webhookSecret.update({
        where: { id: matchedSecretId },
        data: { lastUsedAt: new Date() },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    try {
      await prisma.webhookDelivery.update({
        where: { eventId: event.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      })
    } catch {
      // Ignore secondary failures
    }
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
