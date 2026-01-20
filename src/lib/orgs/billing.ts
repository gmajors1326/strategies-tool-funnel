import { prisma } from '@/src/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const getActiveSeatCount = async (orgId: string) => {
  const members = await prisma.organizationMember.findMany({
    where: { orgId, status: 'active', NOT: { role: 'viewer' } },
  })
  return members.length
}

export const updateSubscriptionSeats = async (orgId: string) => {
  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (!org?.stripeSubscriptionId) return
  const stripe = getStripe()
  const seatCount = await getActiveSeatCount(orgId)
  await stripe.subscriptions.update(org.stripeSubscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(org.stripeSubscriptionId)).items.data[0].id,
        quantity: seatCount,
      },
    ],
    metadata: {
      orgId,
      seatQuantity: String(seatCount),
    },
  })
}
