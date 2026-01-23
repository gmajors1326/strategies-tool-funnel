'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PLAN_CONFIG } from '@/src/lib/billing/planConfig'
import { PLAN_SKUS, TOKEN_PACK_SKUS } from '@/src/lib/billing/skus'
import { PricingCard } from '@/src/components/billing/PricingCard'
import { FeatureList } from '@/src/components/billing/FeatureList'
import { CurrentPlanPill } from '@/src/components/billing/CurrentPlanPill'
import { TokenPackCard } from '@/src/components/billing/TokenPackCard'
import { Button } from '@/src/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AppPanel } from '@/components/ui/AppPanel'
import { formatLocalTime } from '@/src/lib/locks/lockCopy'

export const dynamic = 'force-dynamic'

type UiConfigSummary = {
  user: { planId: string }
  usage: { tokensRemaining: number; resetsAtISO: string }
}

const PLAN_FEATURES = {
  free: [
    'Limited daily AI runs',
    'Access to core tools',
    'Basic outputs',
    'Standard cooldowns',
    'Community support',
  ],
  pro: [
    'Higher daily AI tokens',
    'Pro-only tools unlocked',
    'Faster or no cooldowns',
    'Save to Vault / templates',
    'Exports (PDF/CSV/templates)',
    'Priority support',
  ],
  team: [
    'Highest limits',
    'Shared workspace',
    'Central billing',
    'Admin controls',
    'Priority support',
  ],
}

const PLAN_LIMITS = {
  free: (tokens: number) => [
    `Daily AI tokens: ${tokens.toLocaleString()}`,
    'Cooldowns: Standard',
    'Exports/Save: Limited',
  ],
  pro: (tokens: number) => [
    `Daily AI tokens: ${tokens.toLocaleString()}`,
    'Cooldowns: Faster',
    'Exports/Save: Included',
  ],
  team: (tokens: number) => [
    `Daily AI tokens: ${tokens.toLocaleString()}`,
    'Cooldowns: Fastest',
    'Exports/Save: Included',
  ],
}

const TOKEN_PACK_BEST_FOR: Record<string, string> = {
  small: 'Best for occasional spikes',
  medium: 'Best for weekly growth pushes',
  large: 'Best for heavy testing',
}

function getPlanLabel(planId?: string | null) {
  if (planId === 'pro_monthly') return 'Pro'
  if (planId === 'team') return 'Team'
  if (planId === 'lifetime') return 'Lifetime'
  return 'Free'
}

export default function PricingPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = React.useState<'plans' | 'tokens'>('plans')
  const [uiConfig, setUiConfig] = React.useState<UiConfigSummary | null>(null)

  React.useEffect(() => {
    if (tabParam === 'tokens' || reason === 'tokens') {
      setActiveTab('tokens')
    } else {
      setActiveTab('plans')
    }
  }, [tabParam, reason])

  React.useEffect(() => {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'pricing_viewed',
        meta: { tab: activeTab, reason },
      }),
    })
  }, [activeTab, reason])

  React.useEffect(() => {
    let active = true
    async function loadUi() {
      try {
        const res = await fetch('/api/me/ui-config', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as UiConfigSummary
        if (!active) return
        setUiConfig(json)
      } catch {
        setUiConfig(null)
      }
    }
    loadUi()
    return () => {
      active = false
    }
  }, [])

  const currentPlanLabel = uiConfig ? getPlanLabel(uiConfig.user.planId) : null
  const tokensRemaining = uiConfig?.usage?.tokensRemaining ?? null
  const resetTime = uiConfig?.usage?.resetsAtISO ?? null

  const avgTokensPerRun = React.useMemo(() => {
    const avg = Math.round((PLAN_CONFIG.pro.tokensPerDay || 25000) / (PLAN_CONFIG.pro.runsPerDay || 50))
    return Math.max(100, avg)
  }, [])

  const notice =
    reason === 'tokens'
      ? 'You’re locked by tokens. Buying a pack unlocks runs instantly.'
      : reason === 'plan'
        ? 'This tool is part of Pro.'
        : reason === 'cooldown'
          ? 'Pro skips most cooldowns.'
          : null

  async function checkoutSku(sku: string) {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'checkout_started',
        meta: { sku, type: sku.startsWith('tokens_') ? 'tokens' : 'plan', reason },
      }),
    })
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku }),
    })
    const data = await res.json()
    if (data?.url) window.location.href = data.url
  }

  async function openPortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data?.url) window.location.href = data.url
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">Pricing</h1>
            {currentPlanLabel ? <CurrentPlanPill label={`You’re on ${currentPlanLabel}`} /> : null}
          </div>
          <p className="text-sm text-[hsl(var(--muted))]">
            Upgrade when you need more runs, exports, and advanced tools.
          </p>
          {tokensRemaining !== null ? (
            <p className="text-xs text-[hsl(var(--muted))]">
              Tokens remaining: {tokensRemaining.toLocaleString()} · Reset at {formatLocalTime(resetTime || undefined)}
            </p>
          ) : null}
        </div>

        {notice ? (
          <AppPanel className="text-sm">{notice}</AppPanel>
        ) : null}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'plans' | 'tokens')}>
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {PLAN_SKUS.filter((plan) => plan.planId !== 'lifetime').map((plan) => {
                const planKey = plan.planId === 'team' ? 'team' : plan.planId === 'pro_monthly' ? 'pro' : 'free'
                const caps = planKey === 'team' ? PLAN_CONFIG.business : planKey === 'pro' ? PLAN_CONFIG.pro : PLAN_CONFIG.free
                const isCurrent =
                  (plan.planId === 'pro_monthly' &&
                    (uiConfig?.user.planId === 'pro_monthly' || uiConfig?.user.planId === 'lifetime')) ||
                  (plan.planId === 'team' && uiConfig?.user.planId === 'team') ||
                  (plan.planId === 'free' && (uiConfig?.user.planId ?? 'free') === 'free')

                return (
                  <PricingCard
                    key={plan.id}
                    title={plan.title}
                    subtitle={plan.subtitle}
                    price={plan.priceDisplay}
                    interval={plan.billingInterval}
                    featured={plan.featured}
                  >
                    <FeatureList items={PLAN_FEATURES[planKey]} />
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] p-3 text-xs text-[hsl(var(--muted))]">
                      <div className="font-semibold text-[hsl(var(--text))]">Limits</div>
                      <ul className="mt-1 space-y-1">
                        {PLAN_LIMITS[planKey](caps.tokensPerDay).map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2">
                      {plan.planId === 'free' ? (
                        <Link href="/app">
                          <Button className="w-full">Start free</Button>
                        </Link>
                      ) : isCurrent ? (
                        <Button variant="outline" className="w-full" onClick={openPortal}>
                          Manage plan
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => checkoutSku(plan.id)}>
                          {plan.planId === 'team' ? 'Contact / Upgrade' : 'Unlock Pro'}
                        </Button>
                      )}
                      <Link href="/pricing?tab=plans" className="text-xs text-[hsl(var(--muted))] underline">
                        See what&apos;s included
                      </Link>
                    </div>
                  </PricingCard>
                )
              })}
            </div>

            <div className="mt-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 text-sm">
              <div className="text-sm font-semibold">Plan comparison</div>
              <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
                <div className="text-[hsl(var(--muted))]">Feature</div>
                <div className="text-[hsl(var(--muted))]">Free</div>
                <div className="text-[hsl(var(--muted))]">Pro</div>
                <div className="text-[hsl(var(--muted))]">Team</div>
                <div>Daily tokens</div>
                <div>{PLAN_CONFIG.free.tokensPerDay.toLocaleString()}</div>
                <div>{PLAN_CONFIG.pro.tokensPerDay.toLocaleString()}</div>
                <div>{PLAN_CONFIG.business.tokensPerDay.toLocaleString()}</div>
                <div>Cooldowns</div>
                <div>Standard</div>
                <div>Faster</div>
                <div>Fastest</div>
                <div>Save/Export</div>
                <div>Limited</div>
                <div>Included</div>
                <div>Included</div>
              </div>
            </div>

            <div className="mt-8">
              <Accordion type="single" collapsible>
                <AccordionItem value="limits">
                  <AccordionTrigger>What happens when I hit limits?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>Tokens reset daily at {formatLocalTime(resetTime || undefined)}.</p>
                      <p>Cooldowns apply per tool to keep results accurate and fair.</p>
                      <p>Pro unlocks more runs, higher token caps, and faster cooldowns.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="tokens">
            <div className="grid gap-4 md:grid-cols-3">
              {TOKEN_PACK_SKUS.map((pack) => {
                const runs = Math.max(1, Math.floor(pack.tokensGranted / avgTokensPerRun))
                const packKey = pack.packId
                return (
                  <TokenPackCard
                    key={pack.id}
                    title={pack.title.replace('Token Pack: ', '')}
                    tokens={pack.tokensGranted}
                    runsEstimate={`≈ ${runs} runs`}
                    bestFor={TOKEN_PACK_BEST_FOR[packKey] || 'Best for occasional spikes'}
                  >
                    <Button className="w-full" onClick={() => checkoutSku(pack.id)}>
                      Buy tokens
                    </Button>
                  </TokenPackCard>
                )
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 text-sm">
                <h3 className="text-sm font-semibold">Tokens explained</h3>
                <p className="mt-2 text-[hsl(var(--muted))]">
                  Tokens are pay-as-you-go runs for AI-heavy tools. Plan tokens reset daily; packs add on top.
                </p>
              </div>
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 text-sm">
                <h3 className="text-sm font-semibold">When you run out</h3>
                <p className="mt-2 text-[hsl(var(--muted))]">
                  You’ve used today’s AI tokens. Tokens reset automatically at {formatLocalTime(resetTime || undefined)} or
                  you can buy more.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-[hsl(var(--muted))]">
          Questions?{' '}
          <Link href="/help" className="underline">
            Read how limits work.
          </Link>
        </div>
      </div>
    </div>
  )
}
