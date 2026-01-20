import Link from 'next/link'
import { getMockRefunds } from '@/src/lib/mock/data'
import { Table } from '@/components/app/Table'

export const dynamic = 'force-dynamic'

export default function AdminRefundsPage() {
  const refunds = getMockRefunds()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Refund Queue</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Pending refund requests.</p>
      </div>
      <Table
        headers={['Refund', 'User', 'Amount', 'Status']}
        rows={refunds.map((refund) => [
          <Link key={refund.id} href={`/admin/billing/refunds/${refund.id}`} className="text-red-300 hover:text-red-200">
            {refund.id}
          </Link>,
          refund.userId,
          `${refund.amount} ${refund.currency}`,
          refund.status,
        ])}
      />
    </section>
  )
}
