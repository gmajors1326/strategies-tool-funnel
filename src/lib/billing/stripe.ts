import Stripe from 'stripe'
import { prisma } from '@/src/lib/prisma'

let stripeClient: Stripe | null = null

export function getStripe() {
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

export async function ensureStripeCustomer(userId: string, email?: string | null) {
  const prismaAny = prisma as any
  const existing = await prismaAny.billingCustomer.findUnique({
    where: { userId },
  })
  if (existing) return existing

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { userId },
  })

  return prismaAny.billingCustomer.create({
    data: {
      userId,
      stripeCustomerId: customer.id,
    },
  })
}
