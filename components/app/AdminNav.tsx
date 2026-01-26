'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type AdminRole = 'admin' | 'support' | 'analyst'
type AccessScope = 'any' | 'admin' | 'support' | 'analytics'

const ADMIN_ITEMS: Array<{ label: string; href: string; access: AccessScope }> = [
  { label: 'Analytics', href: '/admin/analytics', access: 'analytics' },
  { label: 'Leads', href: '/admin/leads', access: 'analytics' },
  { label: 'Billing', href: '/admin/billing', access: 'support' },
  { label: 'Usage', href: '/admin/usage', access: 'analytics' },
  { label: 'Support', href: '/admin/support', access: 'support' },
  { label: 'Refunds', href: '/admin/billing/refunds', access: 'support' },
  { label: 'Tool Config', href: '/admin/tools', access: 'admin' },
  { label: 'Tokens', href: '/admin/tokens', access: 'admin' },
  { label: 'Payments', href: '/admin/payments', access: 'analytics' },
  { label: 'Orgs', href: '/admin/orgs', access: 'admin' },
  { label: 'Access', href: '/admin/access', access: 'admin' },
  { label: 'Audit Log', href: '/admin/audit', access: 'admin' },
]

const ACCESS_LABELS: Record<Exclude<AccessScope, 'any'>, string> = {
  admin: 'Admin',
  support: 'Support',
  analytics: 'Analytics',
}

const canAccess = (role: AdminRole, scope: AccessScope) => {
  if (role === 'admin') return true
  if (scope === 'any') return true
  if (role === 'support') return scope === 'support'
  if (role === 'analyst') return scope === 'analytics'
  return false
}

export function AdminNav({ role = 'admin' }: { role?: AdminRole }) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {ADMIN_ITEMS.filter((item) => canAccess(role, item.access)).map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition',
              isActive
                ? 'bg-[hsl(var(--primary))/0.18] text-[hsl(var(--text))]'
                : 'text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-3))]'
            )}
          >
            <span>{item.label}</span>
            {item.access !== 'any' ? (
              <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted))]">
                {ACCESS_LABELS[item.access]}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
