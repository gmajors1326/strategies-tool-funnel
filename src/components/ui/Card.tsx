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
        'rounded-2xl border border-[#d2c1a8] bg-[#eadcc7] p-5 text-[#2f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)]',
        className
      )}
    >
      {children}
    </div>
  )
}
