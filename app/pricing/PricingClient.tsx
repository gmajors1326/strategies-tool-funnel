'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PLAN_CONFIG, type PlanKey } from '@/src/lib/billing/planConfig'
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
  business: [
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
  business: (tokens: number) => [
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

export function PricingClient() {
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

        {notice ? <AppPanel className="text-sm">{notice}</AppPanel> : null}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'plans' | 'tokens')}>
          <TabsList>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {PLAN_SKUS.filter((plan) => plan.planId !== 'lifetime').map((plan) => {
                const planKey: PlanKey =
                  plan.planId === 'team' ? 'business' : plan.planId === 'pro_monthly' ? 'pro' : 'free'
                const features = PLAN_FEATURES[planKey]
                const limits = PLAN_LIMITS[planKey](PLAN_CONFIG[planKey].tokensPerDay)
                const isCurrent = uiConfig?.user?.planId === plan.planId
                return (
                  <PricingCard
                    key={plan.id}
                    title={PLAN_CONFIG[planKey].name}
                    subtitle={PLAN_CONFIG[planKey].subtitle}
                    price={PLAN_CONFIG[planKey].price}
                    featured={planKey === 'pro'}
                    badge={planKey === 'pro' ? 'Most popular' : undefined}
                    features={<FeatureList items={features} />}
                    limits={limits}
                    footer={
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => {
                            if (isCurrent) return openPortal()
                            return checkoutSku(plan.id)
                          }}
                        >
                          {isCurrent ? 'Manage plan' : planKey === 'free' ? 'Start free' : 'Unlock Pro'}
                        </Button>
                        <Link href={`/pricing?tab=plans#${planKey}`} className="text-xs text-[hsl(var(--muted))]">
                          See what&apos;s included
                        </Link>
                      </div>
                    }
                  />
                )
              })}
            </div>

            <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 text-sm">
              <div className="text-xs uppercase text-[hsl(var(--muted))] mb-2">Plan comparison</div>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                  <div className="text-xs text-[hsl(var(--muted))]">Daily tokens</div>
                  <div className="text-sm">Free {PLAN_CONFIG.free.tokensPerDay.toLocaleString()}</div>
                  <div className="text-sm">Pro {PLAN_CONFIG.pro.tokensPerDay.toLocaleString()}</div>
                  <div className="text-sm">Team {PLAN_CONFIG.team.tokensPerDay.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                  <div className="text-xs text-[hsl(var(--muted))]">Cooldowns</div>
                  <div className="text-sm">Free Standard</div>
                  <div className="text-sm">Pro Faster</div>
                  <div className="text-sm">Team Fastest</div>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] p-3">
                  <div className="text-xs text-[hsl(var(--muted))]">Save / Export</div>
                  <div className="text-sm">Free Limited</div>
                  <div className="text-sm">Pro Included</div>
                  <div className="text-sm">Team Included</div>
                </div>
              </div>
            </div>

            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="limits">
                <AccordionTrigger>What happens when I hit limits?</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-[hsl(var(--muted))]">
                    Plans include a daily token reset, and Pro unlocks more tools with faster cooldowns.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="tokens">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {TOKEN_PACK_SKUS.map((pack) => {
                const packKey = pack.packId.replace('tokens_', '')
                const bestFor = TOKEN_PACK_BEST_FOR[packKey] || 'Best for quick boosts'
                return (
                  <TokenPackCard
                    key={pack.id}
                    title={pack.name}
                    tokens={pack.tokensGranted}
                    price={pack.price}
                    bestFor={bestFor}
                    runsEstimate={Math.round(pack.tokensGranted / avgTokensPerRun)}
                    onBuy={() => checkoutSku(pack.id)}
                  />
                )
              })}
            </div>

            <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 text-sm">
              <div className="text-xs uppercase text-[hsl(var(--muted))] mb-2">Tokens explained</div>
              <p className="text-sm text-[hsl(var(--muted))]">
                Tokens are pay-as-you-go runs for AI-heavy tools. Packs stack on top of plan limits.
              </p>
              <div className="mt-3 text-xs text-[hsl(var(--muted))]">
                You’ve used today’s AI tokens. Tokens reset automatically at {formatLocalTime(resetTime || undefined)} or
                you can buy more.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => checkoutSku('tokens_small')}>
            Buy tokens
          </Button>
          <Link href="/help" className="text-xs text-[hsl(var(--muted))]">
            Questions? Read how limits work.
          </Link>
        </div>
      </div>
    </div>
  )
}
