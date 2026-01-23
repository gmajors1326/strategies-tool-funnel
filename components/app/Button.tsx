'use client'

import type { ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
  asChild?: boolean
}

export function Button({ variant = 'primary', className, asChild = false, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60'
  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-500',
    outline: 'border border-[hsl(var(--border))] text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-3))]',
    ghost: 'text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-3))]',
  }

  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(base, variants[variant], className)}
      {...props}
    />
  )
}
