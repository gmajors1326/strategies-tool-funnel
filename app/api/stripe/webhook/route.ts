import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { grantEntitlement } from '@/lib/entitlements'
import { Plan } from '@prisma/client'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET is not set' },
      { status: 500 }
    )
  }
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
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

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
