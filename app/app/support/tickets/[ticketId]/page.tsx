import { getMockTicketDetail } from '@/src/lib/mock/data'
import { Button } from '@/components/app/Button'
import { Input } from '@/components/app/Input'

export const dynamic = 'force-dynamic'

export default function SupportTicketDetailPage({ params }: { params: { ticketId: string } }) {
  const ticket = getMockTicketDetail(params.ticketId)

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Ticket {ticket.id}</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Status: {ticket.status}</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
        {ticket.thread.map((msg) => (
          <div key={msg.id} className="rounded-md bg-[hsl(var(--surface-3))] p-3 text-xs">
            <p className="text-[hsl(var(--muted))]">{msg.author}</p>
            <p className="text-[hsl(var(--text))]">{msg.message}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
        <Input placeholder="Reply to support..." />
        <Button>Send reply</Button>
      </div>
    </section>
  )
}
