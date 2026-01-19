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

    // Get app URL from env or construct from request
    let appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl || !appUrl.startsWith('http')) {
      const host = request.headers.get('host') || 'localhost:3000'
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      appUrl = `${protocol}://${host}`
    }
    
    // Ensure URL has https:// scheme
    if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
      appUrl = `https://${appUrl}`
    }
    
    console.info('[stripe/checkout] Using app URL:', appUrl)
    
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

    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[stripe/checkout] Error:', errorMessage)
    console.error('[stripe/checkout] Stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
