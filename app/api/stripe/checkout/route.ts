import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createCheckoutSession } from '@/lib/stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  planId: z.enum(['dm_engine', 'the_strategy', 'all_access']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { planId } = checkoutSchema.parse(body)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const checkoutSession = await createCheckoutSession(
      session.userId,
      session.email,
      planId,
      `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      `${appUrl}/cancel`
    )

    return NextResponse.json({
      url: checkoutSession.url,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
