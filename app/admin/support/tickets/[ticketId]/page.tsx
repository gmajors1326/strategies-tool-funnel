import { requireAdminPage } from '@/src/lib/auth/requireAdmin'
import { getTicketDetailForAdmin } from '@/src/lib/support/tickets'
import { Button } from '@/components/app/Button'

export const dynamic = 'force-dynamic'

export default async function AdminTicketDetailPage({ params }: { params: { ticketId: string } }) {
  await requireAdminPage()
  const detail = await getTicketDetailForAdmin(params.ticketId)

  if (!detail) {
    return (
      <section className="space-y-4">
        <h1 className="text-lg font-semibold">Ticket not found</h1>
        <p className="text-sm text-[hsl(var(--muted))]">The support ticket could not be located.</p>
      </section>
    )
  }

  const { ticket, userContext } = detail

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Ticket {ticket.id}</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Admin view with user context.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {ticket.thread.map((msg) => (
            <div key={msg.id} className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3 text-xs">
              <p className="text-[hsl(var(--muted))]">{msg.author}</p>
              <p>{msg.message}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
            <p className="text-sm font-semibold">User Context</p>
            <p className="text-xs text-[hsl(var(--muted))]">User ID: {userContext.userId}</p>
            <p className="text-xs text-[hsl(var(--muted))]">Email: {userContext.email ?? 'unknown'}</p>
            <p className="text-xs text-[hsl(var(--muted))]">Plan: {userContext.planId ?? 'unknown'}</p>
          </div>
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
            <p className="text-sm font-semibold">Admin Actions</p>
            <Button variant="outline">Escalate</Button>
            <Button variant="outline">Issue Credit</Button>
            <Button>Resolve</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
