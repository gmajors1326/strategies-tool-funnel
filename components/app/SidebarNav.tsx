'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'My Tools', href: '/app' },
  { label: 'Explore', href: '/app/explore' },
  { label: 'Usage', href: '/app/usage' },
  { label: 'History', href: '/app/history' },
  { label: 'Support', href: '/app/support' },
  { label: 'Account', href: '/app/account' },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
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
