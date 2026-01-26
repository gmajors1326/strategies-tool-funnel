'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PLAN_CATALOG, getPlanTierFromPlanId, type PlanTier } from '@/src/lib/billing/planCatalog'
import { STRIPE_CATALOG } from '@/src/lib/billing/stripeCatalog'
import { DAILY_TOKENS } from '@/src/lib/billing/tokenEconomy'
import { getRolloverPolicy } from '@/src/lib/billing/tokenRollover'
import { CurrentPlanPill } from '@/src/components/billing/CurrentPlanPill'
import { TokenPackCard } from '@/src/components/billing/TokenPackCard'
import { Button } from '@/src/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AppPanel } from '@/components/ui/AppPanel'
import { formatLocalTime } from '@/src/lib/locks/lockCopy'
import { FaqBlock } from '@/src/components/marketing/FaqBlock'

type UiConfigSummary = {
  user: { planId: string }
  usage: { tokensRemaining: number; resetsAtISO: string }
}

export function PricingClient() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const tabParam = searchParams.get('tab')
  const feature = searchParams.get('feature')
  const intent = searchParams.get('intent')

  const [activeTab, setActiveTab] = React.useState<'plans' | 'tokens'>('plans')
  const [uiConfig, setUiConfig] = React.useState<UiConfigSummary | null>(null)
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null)

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

  const currentTier: PlanTier = getPlanTierFromPlanId(uiConfig?.user?.planId)
  const currentPlanLabel = uiConfig ? PLAN_CATALOG[currentTier].displayName : null
  const tokensRemaining = uiConfig?.usage?.tokensRemaining ?? null
  const resetTime = uiConfig?.usage?.resetsAtISO ?? null

  const avgTokensPerRun = React.useMemo(() => {
    const avg = Math.round(DAILY_TOKENS.pro / 50)
    return Math.max(40, avg)
  }, [])

  const notice =
    reason === 'tokens'
      ? 'You’re locked by tokens. Buying a pack unlocks runs instantly.'
      : reason === 'plan'
        ? 'This tool is part of Pro.'
        : reason === 'cooldown'
          ? 'Pro skips most cooldowns.'
          : intent === 'signup'
          ? 'Choose a plan to start your membership. The 7-day trial starts instantly.'
            : null

  const comparisonRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (reason === 'plan') {
      comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [reason])

  const rowClass = (key: string) =>
    feature === key ? 'ring-1 ring-[hsl(var(--ring))] border-[hsl(var(--ring))]' : 'border-[hsl(var(--border))]'

  async function checkout(priceId: string, mode: 'subscription' | 'payment') {
    setLoadingAction(priceId)
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'checkout_started',
        meta: { priceId, mode, reason },
      }),
    })
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode, returnTo: `/pricing?tab=${mode === 'payment' ? 'tokens' : 'plans'}` }),
      })
      const data = await res.json()
      if (data?.url) window.location.href = data.url
    } finally {
      setLoadingAction(null)
    }
  }

  async function openPortal() {
    setLoadingAction('portal')
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data?.url) window.location.href = data.url
    } finally {
      setLoadingAction(null)
    }
  }

  const PLAN_ACCENTS: Record<PlanTier, { ring: string; text: string; dot: string }> = {
    free: { ring: 'ring-emerald-400/40', text: 'text-emerald-300', dot: 'bg-emerald-400' },
    pro: { ring: 'ring-violet-400/40', text: 'text-violet-300', dot: 'bg-violet-400' },
    elite: { ring: 'ring-sky-400/40', text: 'text-sky-300', dot: 'bg-sky-400' },
  }

  return (
    <div className="min-h-screen bg-[#6b8b62] text-[#f2f5ef]">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-sm bg-[#e3d4be] px-3 py-1 text-xs uppercase tracking-[0.25em] text-[#6a5c4a]">
              Our Plans
            </div>
            <h1 className="text-2xl font-semibold">Pick the momentum that fits.</h1>
            <p className="text-sm text-[#e6efe0]">
              Upgrade when you need more runs, exports, and advanced tools.
            </p>
            {tokensRemaining !== null ? (
              <p className="text-xs text-[#e6efe0]">
                Tokens remaining: {tokensRemaining.toLocaleString()} · Reset at {formatLocalTime(resetTime || undefined)}
              </p>
            ) : null}
          </div>
          {currentPlanLabel ? <CurrentPlanPill label={`You’re on ${currentPlanLabel}`} /> : null}
        </div>

        {notice ? <AppPanel className="text-sm">{notice}</AppPanel> : null}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'plans' | 'tokens')}>
          <TabsList className="bg-[#e3d4be] text-[#5f6b52] border border-[#d2c1a8]">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div className="space-y-3 text-sm text-[#5f6b52]">
                <p>
                  Simple tiers, clear limits. Upgrade when you need higher runs or exports. Cancel anytime.
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a6a55]">Monthly plans</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(Object.keys(PLAN_CATALOG) as PlanTier[]).map((tier) => {
                  const plan = PLAN_CATALOG[tier]
                  const accents = PLAN_ACCENTS[tier]
                  const isCurrent = currentTier === tier
                  const stripePlan = tier === 'free' ? null : STRIPE_CATALOG.plans[tier]
                  const rollover = getRolloverPolicy(tier)
                  return (
                    <div
                      key={tier}
                      className={`rounded-2xl border border-[#d2c1a8] bg-[#eadcc7] p-6 text-center text-[#2f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)] ring-1 ${accents.ring}`}
                    >
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e3d4be]">
                        <span className={`h-3 w-3 rounded-full ${accents.dot}`} />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a5c4a]">
                        {plan.displayName}
                      </p>
                      <p className={`mt-2 text-3xl font-semibold ${accents.text}`}>
                        {plan.monthlyPrice === 0 ? '$0' : `$${plan.monthlyPrice}`}
                      </p>
                      <p className="text-xs text-[#6a5c4a]">{plan.monthlyPrice === 0 ? '7-day trial' : 'per month'}</p>
                      <p className="mt-3 text-xs text-[#6a5c4a]">
                        {tier === 'free' ? 'Try everything free for 7 days.' : 'Upgrade to unlock more.'}
                      </p>

                      <div className="mt-4 space-y-2 text-xs text-[#3f4a36]">
                        {plan.features.slice(0, 6).map((item) => (
                          <div key={item} className="border-t border-[#d8c9b2] pt-2">
                            {item}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 space-y-1 text-[11px] text-[#6a5c4a]">
                        <div>Daily tokens: {DAILY_TOKENS[tier].toLocaleString()}</div>
                        <div>Rollover: {rollover.enabled ? `up to ${rollover.capDays} days` : 'none'}</div>
                        <div>History: {plan.entitlements.historyDepth === 'unlimited' ? 'Unlimited' : plan.entitlements.historyDepth}</div>
                      </div>

                      <div className="mt-5 flex flex-col gap-2">
                        {tier === 'free' ? (
                          <Button onClick={() => window.location.assign('/tools')}>Start trial</Button>
                        ) : (
                          <Button
                            onClick={() => {
                              if (isCurrent) return
                              if (stripePlan?.priceId) {
                                void checkout(stripePlan.priceId, 'subscription')
                              }
                            }}
                            disabled={isCurrent || loadingAction === stripePlan?.priceId}
                          >
                            {isCurrent ? 'Current plan' : loadingAction === stripePlan?.priceId ? 'Redirecting…' : 'Upgrade'}
                          </Button>
                        )}
                        {isCurrent && tier !== 'free' ? (
                          <Button variant="outline" onClick={() => openPortal()} disabled={loadingAction === 'portal'}>
                            {loadingAction === 'portal' ? 'Opening…' : 'Manage plan'}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              ref={comparisonRef}
              id="comparison"
              className="mt-6 rounded-xl border border-[#d2c1a8] bg-[#eadcc7] p-4 text-sm text-[#4f5b45] shadow-[0_12px_24px_rgba(48,40,28,0.18)]"
            >
              <div className="mb-3 text-xs uppercase text-[#6a5c4a]">Plan comparison</div>
              <div className="overflow-x-auto">
                <div className="min-w-[640px] space-y-2 text-xs">
                  <div className="grid grid-cols-4 gap-2">
                    <div />
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2 text-center">Trial</div>
                    <div className="rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 text-center font-semibold shadow-[0_0_0_1px_rgba(210,193,168,0.8)]">
                      Pro
                    </div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2 text-center">Elite</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Daily tokens</div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">200 / day</div>
                    <div className="rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 shadow-[0_0_0_1px_rgba(210,193,168,0.8)]">
                      2,000 / day
                    </div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">6,000 / day</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Rollover</div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">—</div>
                    <div className="rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 shadow-[0_0_0_1px_rgba(210,193,168,0.8)]">
                      Up to 7 days
                    </div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Up to 30 days</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2" id="compare-save">
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 ${rowClass('save')}`}>Save to Vault</div>
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 text-[#7a6a55] ${rowClass('save')}`}>—</div>
                    <div className={`rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 shadow-[0_0_0_1px_rgba(210,193,168,0.8)] ${rowClass('save')}`}>✓</div>
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 ${rowClass('save')}`}>✓</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2" id="compare-export">
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 ${rowClass('export')}`}>Export JSON/CSV</div>
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 text-[#7a6a55] ${rowClass('export')}`}>—</div>
                    <div className={`rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 shadow-[0_0_0_1px_rgba(210,193,168,0.8)] ${rowClass('export')}`}>✓</div>
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 ${rowClass('export')}`}>✓</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2" id="compare-pdf">
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 ${rowClass('pdf')}`}>Export PDF</div>
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 text-[#7a6a55] ${rowClass('pdf')}`}>—</div>
                    <div className={`rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 shadow-[0_0_0_1px_rgba(210,193,168,0.8)] ${rowClass('pdf')}`}>Limited</div>
                    <div className={`rounded-md border border-[#d2c1a8] px-3 py-2 ${rowClass('pdf')}`}>✓</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Cooldowns</div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Standard</div>
                    <div className="rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 shadow-[0_0_0_1px_rgba(210,193,168,0.8)]">
                      Reduced
                    </div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">None</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Usage history depth</div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Last 3 runs</div>
                    <div className="rounded-md border border-[#d2c1a8] bg-[#e3d4be] px-3 py-2 shadow-[0_0_0_1px_rgba(210,193,168,0.8)]">
                      Last 20 runs
                    </div>
                    <div className="rounded-md border border-[#d2c1a8] px-3 py-2">Unlimited</div>
                  </div>
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
              {Object.entries(STRIPE_CATALOG.tokenPacks).map(([key, pack]) => (
                <TokenPackCard
                  key={key}
                  title={`${pack.displayName} Pack`}
                  price={`$${pack.price}`}
                  tokens={pack.tokens}
                  bestFor="Bonus tokens never expire."
                  runsEstimate={`≈ ${Math.round(pack.tokens / avgTokensPerRun)} runs`}
                >
                  <Button onClick={() => checkout(pack.priceId, 'payment')} disabled={loadingAction === pack.priceId}>
                    {loadingAction === pack.priceId ? 'Redirecting…' : 'Buy tokens'}
                  </Button>
                </TokenPackCard>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-[#d2c1a8] bg-[#eadcc7] p-4 text-sm text-[#2f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)]">
              <div className="text-xs uppercase text-[#6a5c4a] mb-2">Tokens explained</div>
              <p className="text-sm text-[#5f6b52]">
                Bonus tokens never expire and stack on top of your daily plan limits.
              </p>
              <div className="mt-3 text-xs text-[#5f6b52]">
                You’ve used today’s AI tokens. Tokens reset automatically at {formatLocalTime(resetTime || undefined)} or
                you can buy more.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <FaqBlock title="FAQ" />

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => checkout(STRIPE_CATALOG.tokenPacks.starter.priceId, 'payment')}
            disabled={loadingAction === STRIPE_CATALOG.tokenPacks.starter.priceId}
          >
            {loadingAction === STRIPE_CATALOG.tokenPacks.starter.priceId ? 'Redirecting…' : 'Buy tokens'}
          </Button>
          <Link href="/help" className="text-xs text-[#6a5c4a]">
            Questions? Read how limits work.
          </Link>
        </div>
      </div>
    </div>
  )
}
