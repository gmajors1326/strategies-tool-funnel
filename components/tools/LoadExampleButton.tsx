'use client'

import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

interface LoadExampleButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function LoadExampleButton({ onClick, disabled }: LoadExampleButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="text-xs sm:text-sm"
    >
      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
      Load Example
    </Button>
  )
}
