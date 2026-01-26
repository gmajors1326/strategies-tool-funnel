'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { AppCard } from '@/components/ui/AppCard'
import { listTools } from '@/src/lib/tools/registry'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { LAUNCH_TOOL_IDS, getLaunchMeta, isLaunchTool } from '@/src/lib/tools/launchTools'
import { FaqBlock } from '@/src/components/marketing/FaqBlock'

export default function HomePage() {
  const allTools = useMemo(() => listTools().filter((tool) => isLaunchTool(tool.id)), [])
  const tools = useMemo(() => {
    const byId = new Map(allTools.map((tool) => [tool.id, tool]))
    return LAUNCH_TOOL_IDS.map((id) => byId.get(id)).filter(
      (tool): tool is (typeof allTools)[number] => Boolean(tool)
    )
  }, [allTools])

  return (
    <div className="min-h-screen bg-[#7d9b76] text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-6 pb-12 md:pt-12 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-b from-[#d7f7de] via-[#9ee8b4] to-[#5ecf85] bg-clip-text text-transparent drop-shadow-[0_6px_18px_rgba(120,255,170,0.35)]">
            Free Spirit Marketing
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Strategic engagement tools that turn conversations into revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Button asChild size="lg">
              <Link href="/verify?next=/">Start 7-day trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/help">Learn more</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 pb-10">
        <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-[#3a3a3a] px-6 py-5 text-white shadow-[0_24px_40px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">7-day trial</p>
              <p className="text-lg font-semibold">Try every tool free for 7 days.</p>
              <p className="text-sm text-white/60">After the trial, choose Pro ($39) or Elite ($99) to keep access.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/verify?next=/">Start trial</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">View plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section id="tool" className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Tools</h2>
                <p className="text-sm text-white/70">The core toolkit.</p>
              </div>
            </div>

          {tools.length === 0 ? (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-6 text-center text-sm text-[hsl(var(--muted))]">
              No tools available.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => {
                const meta = getLaunchMeta(tool.id)
                return (
                  <AppCard
                    key={tool.id}
                    className="p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted))]">
                      {meta?.label ? (
                        <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5">
                          {meta.label}
                        </span>
                      ) : null}
                      {meta?.startHere ? (
                        <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-2 py-0.5 text-[hsl(var(--text))]">
                          Start here
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--text))]">{tool.name}</p>
                      <p className="text-xs text-[hsl(var(--muted))]">{meta?.promise || tool.description}</p>
                    </div>
                    {meta?.outputs?.length ? (
                      <div className="text-xs text-[hsl(var(--muted))]">
                        Outputs:{' '}
                        {meta.outputs.map((out) => (
                          <span
                            key={out}
                            className="mr-1 inline-flex items-center rounded-md border border-[hsl(var(--border))] px-2 py-0.5"
                          >
                            {out}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
                      <span>{tool.tokensPerRun ? `${tool.tokensPerRun} tokens/run` : 'Tokens TBD'}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/tools/${tool.id}`} className="block">
                        <Button
                          className="w-full border-transparent bg-[#7ee6a3] text-[#0f2d1b] hover:bg-[#98efb6] hover:text-[#0f2d1b]"
                          variant="outline"
                        >
                          Open Tool
                        </Button>
                      </Link>
                      <Link href="/help" className="block">
                        <Button className="w-full" variant="outline">
                          Learn more
                        </Button>
                      </Link>
                    </div>
                  </AppCard>
                )
              })}
              <AppCard className="p-4 space-y-2 text-sm text-[hsl(var(--muted))]">
                <p className="text-[hsl(var(--text))] font-semibold">More tools coming soon</p>
                <p>We&apos;re launching in tight batches.</p>
              </AppCard>
            </div>
          )}
          <div className="mt-4 text-xs text-white/70">
            New? Start with Hook Analyzer → then CTA Match → then Caption.
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <FaqBlock />
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
          <p className="text-xl text-[hsl(var(--muted))] mb-8">
            Start your 7-day trial. Pick Pro or Elite when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/help">Learn more →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
