import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  }

  return stripeClient
}

export const PLAN_PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
  elite: process.env.STRIPE_PRICE_ID_ELITE_MONTHLY || '',
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  planId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()
  const priceId = PLAN_PRICE_IDS[planId]
  
  console.info('[stripe] Creating checkout session:', { planId, priceId: priceId || 'MISSING', email })
  
  if (!priceId || priceId.trim() === '') {
    const envVarMap: Record<string, string> = {
      pro: 'STRIPE_PRICE_ID_PRO_MONTHLY',
      elite: 'STRIPE_PRICE_ID_ELITE_MONTHLY',
    }
    const envVarName = envVarMap[planId] || `STRIPE_PRICE_ID_${planId.toUpperCase()}`
    const error = `Stripe price ID not configured for plan "${planId}". Please set ${envVarName} in Vercel Production environment variables.`
    console.error('[stripe]', error)
    throw new Error(error)
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      client_reference_id: userId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId,
      },
    })
    console.info('[stripe] Checkout session created:', session.id)
    return session
  } catch (error: any) {
    console.error('[stripe] Checkout session creation failed:', error.message, error.type)
    throw error
  }
}
