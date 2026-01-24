'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PLAN_CONFIG, type PlanKey } from '@/src/lib/billing/planConfig'
import { PLAN_SKUS, TOKEN_PACK_SKUS } from '@/src/lib/billing/skus'
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
  const feature = searchParams.get('feature')
  const intent = searchParams.get('intent')

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
          : intent === 'signup'
            ? 'Choose a plan to start your membership. Free starts instantly.'
            : null

  const comparisonRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (reason === 'plan') {
      comparisonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [reason])

  const rowClass = (key: string) =>
    feature === key ? 'ring-1 ring-[hsl(var(--ring))] border-[hsl(var(--ring))]' : 'border-[hsl(var(--border))]'

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

  const PLAN_ACCENTS: Record<PlanKey, { ring: string; text: string; dot: string }> = {
    free: { ring: 'ring-emerald-400/40', text: 'text-emerald-300', dot: 'bg-emerald-400' },
    pro: { ring: 'ring-violet-400/40', text: 'text-violet-300', dot: 'bg-violet-400' },
    business: { ring: 'ring-sky-400/40', text: 'text-sky-300', dot: 'bg-sky-400' },
  }

  return (
    <div className="min-h-screen bg-[#2f2f2f] text-white">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center rounded-sm bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/70">
              Our Plans
            </div>
            <h1 className="text-2xl font-semibold">Pick the momentum that fits.</h1>
            <p className="text-sm text-white/60">
              Upgrade when you need more runs, exports, and advanced tools.
            </p>
            {tokensRemaining !== null ? (
              <p className="text-xs text-white/50">
                Tokens remaining: {tokensRemaining.toLocaleString()} · Reset at {formatLocalTime(resetTime || undefined)}
              </p>
            ) : null}
          </div>
          {currentPlanLabel ? <CurrentPlanPill label={`You’re on ${currentPlanLabel}`} /> : null}
        </div>

        {notice ? <AppPanel className="text-sm">{notice}</AppPanel> : null}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'plans' | 'tokens')}>
          <TabsList className="bg-white/5 text-white/70">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div className="space-y-3 text-sm text-white/60">
                <p>
                  Simple tiers, clear limits. Upgrade when you need higher runs or exports. Cancel anytime.
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Monthly plans</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {PLAN_SKUS.filter((plan) => plan.planId !== 'lifetime').map((plan) => {
                const planKey: PlanKey =
                  plan.planId === 'team' ? 'business' : plan.planId === 'pro_monthly' ? 'pro' : 'free'
                const features = PLAN_FEATURES[planKey]
                const limits = PLAN_LIMITS[planKey](PLAN_CONFIG[planKey].tokensPerDay)
                const isCurrent = uiConfig?.user?.planId === plan.planId
                const accents = PLAN_ACCENTS[planKey]
                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border border-white/10 bg-[#3a3a3a] p-6 text-center shadow-[0_24px_40px_rgba(0,0,0,0.35)] ring-1 ${accents.ring}`}
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                      <span className={`h-3 w-3 rounded-full ${accents.dot}`} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                      {plan.title}
                    </p>
                    <p className={`mt-2 text-3xl font-semibold ${accents.text}`}>{plan.priceDisplay}</p>
                    {plan.billingInterval ? (
                      <p className="text-xs text-white/50">per {plan.billingInterval}</p>
                    ) : (
                      <p className="text-xs text-white/50">always free</p>
                    )}
                    <p className="mt-3 text-xs text-white/50">{plan.subtitle}</p>

                    <div className="mt-4 space-y-2 text-xs text-white/70">
                      {features.map((item) => (
                        <div key={item} className="border-t border-white/5 pt-2">
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-1 text-[11px] text-white/50">
                      {limits.map((item) => (
                        <div key={item}>{item}</div>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-2">
                      <Button
                        onClick={() => {
                          if (isCurrent) return openPortal()
                          return checkoutSku(plan.id)
                        }}
                      >
                        {isCurrent ? 'Manage plan' : planKey === 'free' ? 'Start free' : 'Unlock Pro'}
                      </Button>
                      <Link href={`/pricing?tab=plans#${planKey}`} className="text-xs text-white/50">
                        See what&apos;s included
                      </Link>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>

            <div
              ref={comparisonRef}
              id="comparison"
              className="mt-6 rounded-xl border border-white/10 bg-[#3a3a3a] p-4 text-sm text-white/70"
            >
              <div className="text-xs uppercase text-white/50 mb-3">Plan comparison</div>
              <div className="overflow-x-auto">
                <div className="min-w-[640px] space-y-2 text-xs">
                  <div className="grid grid-cols-4 gap-2">
                    <div />
                    <div className="rounded-md border border-white/10 px-3 py-2 text-center">Free</div>
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-center font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                      Pro
                    </div>
                    <div className="rounded-md border border-white/10 px-3 py-2 text-center">Team</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-white/10 px-3 py-2">Daily tokens</div>
                    <div className="rounded-md border border-white/10 px-3 py-2">1,000 / day</div>
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                      10,000 / day
                    </div>
                    <div className="rounded-md border border-white/10 px-3 py-2">30,000 / day</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-white/10 px-3 py-2">Tool access</div>
                    <div className="rounded-md border border-white/10 px-3 py-2">Core tools</div>
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                      All tools
                    </div>
                    <div className="rounded-md border border-white/10 px-3 py-2">All tools</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2" id="compare-save">
                    <div className={`rounded-md border border-white/10 px-3 py-2 ${rowClass('save')}`}>Save to Vault</div>
                    <div className={`rounded-md border border-white/10 px-3 py-2 text-white/40 ${rowClass('save')}`}>—</div>
                    <div className={`rounded-md border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${rowClass('save')}`}>✓</div>
                    <div className={`rounded-md border border-white/10 px-3 py-2 ${rowClass('save')}`}>✓</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2" id="compare-export">
                    <div className={`rounded-md border border-white/10 px-3 py-2 ${rowClass('export')}`}>Export (JSON / CSV / Template)</div>
                    <div className={`rounded-md border border-white/10 px-3 py-2 text-white/40 ${rowClass('export')}`}>—</div>
                    <div className={`rounded-md border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${rowClass('export')}`}>✓</div>
                    <div className={`rounded-md border border-white/10 px-3 py-2 ${rowClass('export')}`}>✓</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2" id="compare-pdf">
                    <div className={`rounded-md border border-white/10 px-3 py-2 ${rowClass('pdf')}`}>Export PDF</div>
                    <div className={`rounded-md border border-white/10 px-3 py-2 text-white/40 ${rowClass('pdf')}`}>—</div>
                    <div className={`rounded-md border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12)] ${rowClass('pdf')}`}>✓</div>
                    <div className={`rounded-md border border-white/10 px-3 py-2 ${rowClass('pdf')}`}>✓</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-white/10 px-3 py-2">Cooldowns</div>
                    <div className="rounded-md border border-white/10 px-3 py-2">Standard</div>
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                      Reduced / none
                    </div>
                    <div className="rounded-md border border-white/10 px-3 py-2">None</div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-md border border-white/10 px-3 py-2">Usage history depth</div>
                    <div className="rounded-md border border-white/10 px-3 py-2">Last 3 runs</div>
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
                      Last 20 runs
                    </div>
                    <div className="rounded-md border border-white/10 px-3 py-2">Unlimited</div>
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
              {TOKEN_PACK_SKUS.map((pack) => {
                const packKey = pack.packId.replace('tokens_', '')
                const bestFor = TOKEN_PACK_BEST_FOR[packKey] || 'Best for quick boosts'
                return (
                  <TokenPackCard
                    key={pack.id}
                    title={pack.title}
                    tokens={pack.tokensGranted}
                    bestFor={bestFor}
                    runsEstimate={`≈ ${Math.round(pack.tokensGranted / avgTokensPerRun)} runs`}
                  >
                    <Button onClick={() => checkoutSku(pack.id)}>Buy tokens</Button>
                  </TokenPackCard>
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

        <FaqBlock title="FAQ" />

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => checkoutSku('tokens_small')}>
            Buy tokens
          </Button>
          <Link href="/help" className="text-xs text-white/50">
            Questions? Read how limits work.
          </Link>
        </div>
      </div>
    </div>
  )
}
