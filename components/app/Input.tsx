'use client'

import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm text-[hsl(var(--text))] placeholder:text-[hsl(var(--muted))]',
        className
      )}
      {...props}
    />
  )
}
