'use client'

import * as React from 'react'
import Link from 'next/link'
import { AppPanel } from '@/components/ui/AppPanel'
import type { LockReason } from '@/src/lib/locks/lockTypes'
import { getLockCopy } from '@/src/lib/locks/lockCopy'
import { getLockResetAt } from '@/src/lib/locks/lockCompute'

type LockBannerProps = {
  lock: LockReason
  context: 'explore' | 'tool'
  showChips?: boolean
  showUpgradeCta?: boolean
}

const CHIP_LABELS: Record<string, string> = {
  tokens: 'Tokens used',
  plan: 'Pro feature',
  cooldown: 'Cooldown',
}

function getPrimaryHref(lock: LockReason) {
  if (lock.type === 'tokens') return '/pricing?tab=tokens'
  if (lock.type === 'plan' || lock.type === 'multi') return '/pricing'
  if (lock.type === 'cooldown') return '/pricing'
  return null
}

export function LockBanner({ lock, context, showChips = false, showUpgradeCta = true }: LockBannerProps) {
  if (lock.type === 'none') return null
  const resetAt = getLockResetAt(lock)
  const copy = getLockCopy(lock, resetAt, showUpgradeCta)
  if (!copy) return null

  const hasTracked = React.useRef(false)
  React.useEffect(() => {
    if (hasTracked.current) return
    hasTracked.current = true
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'lock_banner_shown',
        meta: { type: lock.type, context },
      }),
    })
  }, [lock.type, context])

  const primaryHref = getPrimaryHref(lock)
  const showPrimary =
    (lock.type !== 'cooldown' || showUpgradeCta) && Boolean(primaryHref) && Boolean(copy.primaryCta)

  const chips =
    lock.type === 'multi'
      ? lock.reasons.map((r) => CHIP_LABELS[r.type]).filter(Boolean)
      : []

  return (
    <AppPanel className="flex flex-col gap-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold">{copy.headline}</div>
        <div className="text-xs text-[hsl(var(--muted))]">{copy.desc}</div>
      </div>

      {showChips && chips.length ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-xs">
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {showPrimary && primaryHref ? (
          <Link
            href={primaryHref}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-1.5 text-xs font-semibold"
            onClick={() => {
              void fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  eventName: 'lock_cta_clicked',
                  meta: { type: lock.type, context, cta: copy.primaryCta },
                }),
              })
            }}
          >
            {copy.primaryCta}
          </Link>
        ) : null}
        {copy.secondary ? <span className="text-[hsl(var(--muted))]">{copy.secondary}</span> : null}
        <Link href="/help" className="text-[hsl(var(--muted))] underline">
          Learn how limits work
        </Link>
      </div>
    </AppPanel>
  )
}
