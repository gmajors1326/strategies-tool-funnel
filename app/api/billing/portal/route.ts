import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { ensureStripeCustomer, getStripe } from '@/src/lib/billing/stripe'

async function createPortalSession(request: NextRequest) {
  const user = await requireUser()
  const customer = await ensureStripeCustomer(user.id, user.email)
  const stripe = getStripe()

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_APP_URL
      : `${request.nextUrl.protocol}//${request.nextUrl.host}`

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${appUrl}/pricing`,
    configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
  })

  return NextResponse.json({ url: session.url })
}

export async function POST(request: NextRequest) {
  return createPortalSession(request)
}

export async function GET(request: NextRequest) {
  return createPortalSession(request)
}
