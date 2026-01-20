import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardProps = {
  className?: string
  children: ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-5', className)}>
      {children}
    </div>
  )
}
