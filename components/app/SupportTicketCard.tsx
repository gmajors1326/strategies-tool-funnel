import Link from 'next/link'
import { StatusBadge } from '@/components/app/StatusBadge'

type SupportTicketCardProps = {
  id: string
  subject: string
  status: 'open' | 'pending' | 'resolved'
  href: string
}

export function SupportTicketCard({ id, subject, status, href }: SupportTicketCardProps) {
  const statusMap = {
    open: 'available',
    pending: 'locked_usage_daily',
    resolved: 'disabled',
  } as const

  return (
    <Link
      href={href}
      className="block rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 hover:border-red-500/60 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">{id}</p>
          <p className="text-sm font-semibold text-[hsl(var(--text))]">{subject}</p>
        </div>
        <StatusBadge status={statusMap[status]} label={status} />
      </div>
    </Link>
  )
}
