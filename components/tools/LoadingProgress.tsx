'use client'

import { AppPanel } from '@/components/ui/AppPanel'

export function LoadingProgress() {
  return (
    <AppPanel className="p-4 sm:p-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--primary))] border-t-transparent"></div>
          <span className="text-xs sm:text-sm text-[hsl(var(--text))]">Running analysis...</span>
        </div>
        <div className="w-full bg-[hsl(var(--surface-2))] rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-[hsl(var(--primary))] animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    </AppPanel>
  )
}
