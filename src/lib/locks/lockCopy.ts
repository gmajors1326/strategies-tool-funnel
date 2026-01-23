import type { LockReason } from '@/src/lib/locks/lockTypes'

type LockCopy = {
  headline: string
  desc: string
  primaryCta?: string
  secondary?: string
}

export function formatLocalTime(iso?: string | null, tz = 'America/Chicago') {
  if (!iso) return 'soon'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'soon'
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function getTokenLockCopy(resetAtISO?: string | null): LockCopy {
  return {
    headline: "You’ve used today’s AI tokens",
    desc: 'Your plan includes a daily token limit to keep tools fast and costs predictable.',
    primaryCta: 'Get more tokens',
    secondary: `Tokens reset automatically at ${formatLocalTime(resetAtISO)}`,
  }
}

export function getPlanLockCopy(): LockCopy {
  return {
    headline: 'This tool is part of Pro',
    desc: 'Free tools cover the basics. Pro tools unlock deeper analysis, exports, and reuse.',
    primaryCta: 'Unlock Pro access',
    secondary: 'Preview available',
  }
}

export function getCooldownLockCopy(availableAtISO?: string | null, showUpgrade = true): LockCopy {
  return {
    headline: 'This tool is on a short cooldown',
    desc: 'To keep results accurate and fair, this tool runs on a timed interval.',
    primaryCta: showUpgrade ? 'Skip cooldowns with Pro' : undefined,
    secondary: `Available again at ${formatLocalTime(availableAtISO)}`,
  }
}

export function getMultiLockCopy(resetAtISO?: string | null): LockCopy {
  return {
    headline: "You’re temporarily locked from this tool",
    desc: 'This tool is limited by both usage and plan level on your account.',
    primaryCta: 'Unlock full access',
    secondary: resetAtISO ? `Next reset at ${formatLocalTime(resetAtISO)}` : undefined,
  }
}

export function getLockCopy(lock: LockReason, resetAtISO?: string | null, showUpgrade = true): LockCopy | null {
  switch (lock.type) {
    case 'tokens':
      return getTokenLockCopy(lock.resetAt)
    case 'plan':
      return getPlanLockCopy()
    case 'cooldown':
      return getCooldownLockCopy(lock.availableAt, showUpgrade)
    case 'multi':
      return getMultiLockCopy(resetAtISO)
    default:
      return null
  }
}

export const MICROCOPY_SWAPS = [
  { from: 'Limit reached', to: 'Today’s usage is complete' },
  { from: 'Upgrade required', to: 'Available on Pro' },
  { from: 'Access denied', to: 'Not included in your plan' },
  { from: 'Error', to: 'This action isn’t available yet' },
  { from: 'You must upgrade', to: 'Unlock full access' },
]
