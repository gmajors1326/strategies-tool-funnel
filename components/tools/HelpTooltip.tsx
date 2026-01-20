'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { AppPanel } from '@/components/ui/AppPanel'

interface HelpTooltipProps {
  content: string
}

export function HelpTooltip({ content }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[hsl(var(--surface-3))] transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-3 h-3 text-[hsl(var(--muted))]" />
      </button>
      {isOpen && (
        <div className="absolute z-50 left-0 top-6 w-64 sm:w-80">
          <AppPanel className="p-3 shadow-lg border-2 border-[hsl(var(--border))]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-[hsl(var(--text))]">{content}</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-shrink-0 p-0.5 hover:bg-[hsl(var(--surface-3))] rounded"
                aria-label="Close help"
              >
                <X className="w-3 h-3 text-[hsl(var(--muted))]" />
              </button>
            </div>
          </AppPanel>
        </div>
      )}
    </div>
  )
}
