import { getMockRefundDetail } from '@/src/lib/mock/data'
import { Button } from '@/components/app/Button'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminRefundDetailPage({ params }: { params: { refundId: string } }) {
  await requireAdmin()
  // TODO: replace (billing): load refund detail from billing provider.
  const refund = await getMockRefundDetail(params.refundId)

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Refund {refund.id}</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Eligibility: {refund.eligibility}</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
        <p className="text-sm">User: {refund.userId}</p>
        <p className="text-sm">Plan: {refund.planId}</p>
        <p className="text-sm">Amount: {refund.amount} {refund.currency}</p>
        <p className="text-xs text-[hsl(var(--muted))]">{refund.reason}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button>Approve</Button>
        <Button variant="outline">Deny</Button>
        <Button variant="outline">Partial</Button>
      </div>
    </section>
  )
}
