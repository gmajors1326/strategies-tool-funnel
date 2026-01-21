import { requireUser } from '@/src/lib/auth/requireUser'
import { listTicketsForUser } from '@/src/lib/support/tickets'
import { Button } from '@/components/app/Button'
import { SupportTicketCard } from '@/components/app/SupportTicketCard'

export const dynamic = 'force-dynamic'

export default async function SupportTicketsPage() {
  const session = await requireUser()
  const tickets = await listTicketsForUser(session.id)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Support Tickets</h1>
          <p className="text-sm text-[hsl(var(--muted))]">Track your support requests.</p>
        </div>
        <Button>Create ticket</Button>
      </div>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <SupportTicketCard
            key={ticket.id}
            id={ticket.id}
            subject={ticket.subject}
            status={ticket.status as 'open' | 'pending' | 'resolved'}
            href={`/app/support/tickets/${ticket.id}`}
          />
        ))}
      </div>
    </section>
  )
}
