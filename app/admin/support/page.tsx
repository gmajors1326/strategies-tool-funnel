import { listTicketsForAdmin } from '@/src/lib/support/tickets'
import { Table } from '@/components/app/Table'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  const tickets = await listTicketsForAdmin()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Support Queue</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Filtered ticket queue.</p>
      </div>

      <Table
        headers={['Ticket', 'Category', 'Status', 'Created']}
        rows={tickets.map((ticket) => [
          <Link
            key={ticket.id}
            href={`/admin/support/${ticket.id}`}
            className="underline underline-offset-4"
          >
            {ticket.subject || ticket.id}
          </Link>,
          ticket.category,
          ticket.status,
          new Date(ticket.createdAt).toLocaleString(),
        ])}
      />
    </section>
  )
}
