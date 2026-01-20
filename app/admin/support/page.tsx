import { getMockTickets } from '@/src/lib/mock/data'
import { Table } from '@/components/app/Table'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function AdminSupportPage() {
  const tickets = getMockTickets()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Support Queue</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Filtered ticket queue.</p>
      </div>
      <Table
        headers={['Ticket', 'Category', 'Status', 'Created']}
        rows={tickets.map((ticket) => [
          <Link key={ticket.id} href={`/admin/support/tickets/${ticket.id}`} className="text-red-300 hover:text-red-200">
            {ticket.id}
          </Link>,
          ticket.category,
          ticket.status,
          new Date(ticket.createdAtISO).toLocaleString(),
        ])}
      />
    </section>
  )
}
