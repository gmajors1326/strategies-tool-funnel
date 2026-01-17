import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

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
  const priceId = PLAN_PRICE_IDS[planId]
  
  if (!priceId) {
    throw new Error(`Invalid plan ID: ${planId}`)
  }

  return stripe.checkout.sessions.create({
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
}
