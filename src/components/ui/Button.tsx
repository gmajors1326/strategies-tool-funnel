'use client'

import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b]',
    outline: 'border border-[#1f3b2b] bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b]',
    ghost: 'bg-[#1f3b2b] text-white hover:bg-[#7ee6a3] hover:text-[#1f3b2b]',
  }

  return <button className={cn(base, variants[variant], className)} {...props} />
}
