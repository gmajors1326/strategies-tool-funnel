'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ADMIN_ITEMS = [
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Support', href: '/admin/support' },
  { label: 'Refunds', href: '/admin/billing/refunds' },
  { label: 'Tool Config', href: '/admin/tools' },
  { label: 'Tokens', href: '/admin/tokens' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Orgs', href: '/admin/orgs' },
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
              'block rounded-md px-3 py-2 text-sm',
              isActive
                ? 'bg-red-600/20 text-red-200'
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
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ADMIN_ITEMS = [
  { label: 'Analytics', href: '/admin/analytics' },
  { label: 'Support', href: '/admin/support' },
  { label: 'Refunds', href: '/admin/billing/refunds' },
  { label: 'Tool Config', href: '/admin/tools' },
  { label: 'Tokens', href: '/admin/tokens' },
  { label: 'Payments', href: '/admin/payments' },
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
              'block rounded-md px-3 py-2 text-sm',
              isActive
                ? 'bg-red-600/20 text-red-200'
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
