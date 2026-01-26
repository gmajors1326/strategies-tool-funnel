import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardProps = {
  className?: string
  children: ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-[#3a3a3a] p-5 text-[hsl(var(--text))] shadow-[0_24px_40px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      {children}
    </div>
  )
}
