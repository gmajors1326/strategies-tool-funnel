'use client'

import { useState, useEffect } from 'react'
import { ToolCategory } from '@/config/toolCategories'
import { ToolShell } from './ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'
import { isToolUnlocked, getNextUnlockHint } from '@/lib/unlock'
import { AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { AppPanel } from '@/components/ui/AppPanel'
import { Lock } from 'lucide-react'

interface ToolCategorySectionProps {
  category: ToolCategory
}

export function ToolCategorySection({ category }: ToolCategorySectionProps) {
  const Icon = category.icon
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-start gap-3">
        <div
          className="rounded-lg p-2.5"
          style={{
            backgroundColor: category.color.badgeBg,
            border: `1px solid ${category.color.badgeBorder}`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color: category.color.accent }} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-semibold text-[hsl(var(--text))] mb-1">
            {category.name}
          </h2>
          <p className="text-sm text-[hsl(var(--muted))]">
            {category.description}
          </p>
        </div>
      </div>

      {/* Tools in Category */}
      <div className="space-y-6">
        {category.tools.map(toolRef => {
          const config = getToolConfig(toolRef.toolId as any)
          const unlocked = mounted ? isToolUnlocked(toolRef.toolId) : false
          const unlockHint = mounted ? getNextUnlockHint(toolRef.toolId) : null

          if (!unlocked) {
            return (
              <AppCard key={toolRef.toolId} className="opacity-75">
                <AppCardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AppCardTitle className="text-lg sm:text-xl">{config.title}</AppCardTitle>
                        <Lock className="h-4 w-4 text-[hsl(var(--muted))]" />
                      </div>
                      <AppCardDescription className="text-xs sm:text-sm">
                        {config.description}
                      </AppCardDescription>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: category.color.badgeBg,
                        border: `1px solid ${category.color.badgeBorder}`,
                        color: category.color.accent,
                      }}
                    >
                      {toolRef.stage}
                    </div>
                  </div>
                </AppCardHeader>
                <AppCardContent className="p-4 sm:p-6 pt-0">
                  <AppPanel variant="subtle" className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <p className="text-sm text-[hsl(var(--muted))]">
                        {unlockHint || 'Complete previous tools to unlock this one.'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-2))]">
                        <span>Risk Level:</span>
                        <span
                          className="px-2 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              toolRef.risk_level === 'low'
                                ? 'rgba(52,211,153,0.12)'
                                : toolRef.risk_level === 'medium'
                                ? 'rgba(251,191,36,0.12)'
                                : 'rgba(248,113,113,0.12)',
                            color:
                              toolRef.risk_level === 'low'
                                ? '#34D399'
                                : toolRef.risk_level === 'medium'
                                ? '#FBBF24'
                                : '#F87171',
                          }}
                        >
                          {toolRef.risk_level}
                        </span>
                      </div>
                    </div>
                  </AppPanel>
                </AppCardContent>
              </AppCard>
            )
          }

          return (
            <div key={toolRef.toolId} className="relative">
              <div
                className="absolute -left-2 top-6 w-1 h-8 rounded-full"
                style={{ backgroundColor: category.color.accent }}
              />
              <ToolShell config={config} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
