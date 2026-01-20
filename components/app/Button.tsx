'use client'

import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60'
  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-500',
    outline: 'border border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-3))]',
    ghost: 'text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-3))]',
  }

  return (
    <button
      className={cn(base, variants[variant], className)}
      {...props}
    />
  )
}
