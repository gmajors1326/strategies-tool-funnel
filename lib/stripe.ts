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
  dm_engine: process.env.STRIPE_PRICE_ID_DM_ENGINE || '',
  the_strategy: process.env.STRIPE_PRICE_ID_THE_STRATEGY || '',
  all_access: process.env.STRIPE_PRICE_ID_ALL_ACCESS || '',
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
  
  console.info('[stripe] Creating checkout session:', { planId, priceId, email })
  
  if (!priceId) {
    const error = `Invalid plan ID: ${planId}. Available plans: ${Object.keys(PLAN_PRICE_IDS).join(', ')}`
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
