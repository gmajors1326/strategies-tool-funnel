'use client'

interface CharacterCounterProps {
  current: number
  max: number
  className?: string
}

export function CharacterCounter({ current, max, className = '' }: CharacterCounterProps) {
  const remaining = max - current
  const isWarning = remaining < max * 0.1 // Warning at 10% remaining
  const isError = remaining < 0

  return (
    <p className={`text-xs ${className} ${
      isError 
        ? 'text-[hsl(var(--destructive))]' 
        : isWarning 
        ? 'text-yellow-500' 
        : 'text-[hsl(var(--muted))]'
    }`}>
      {remaining >= 0 ? `${remaining} characters remaining` : `${Math.abs(remaining)} characters over limit`}
    </p>
  )
}
