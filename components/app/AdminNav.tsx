'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ADMIN_ITEMS = [
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Billing', href: '/admin/billing' },
  { label: 'Usage', href: '/admin/usage' },
  { label: 'Support', href: '/admin/support' },
  { label: 'Refunds', href: '/admin/billing/refunds' },
  { label: 'Tool Config', href: '/admin/tools' },
  { label: 'Tokens', href: '/admin/tokens' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Orgs', href: '/admin/orgs' },
  { label: 'Access', href: '/admin/access' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {ADMIN_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm transition',
              isActive
                ? 'bg-[hsl(var(--primary))/0.18] text-[hsl(var(--text))]'
                : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-3))]'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
