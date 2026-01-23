import { listTicketsForAdmin, type TicketSummary } from '@/src/lib/support/tickets'
import { Table } from '@/components/app/Table'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  let tickets: TicketSummary[] = []
  let errorMessage: string | null = null
  try {
    tickets = await listTicketsForAdmin()
  } catch (err: any) {
    errorMessage = err?.message ?? 'Support queue unavailable.'
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Support Queue</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Filtered ticket queue.</p>
      </div>
      {errorMessage && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200">
          {errorMessage}
        </div>
      )}

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
