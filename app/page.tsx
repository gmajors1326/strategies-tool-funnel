'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Lock, Sparkles, MessageSquare, TrendingUp, Zap, Clock, Download } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#7d9b76] text-foreground">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-28 md:pt-24 md:pb-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#d8ba8c] text-shadow-ink-40">
            The Strategy Tools
          </h1>
          <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl mx-auto">
            Strategic engagement tools that turn conversations into revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-cactus-primary text-white hover:opacity-90 shadow-ink-40">
              <Link href="#tools">Try Free Tools</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/60 hover:bg-accent/60 shadow-ink-40">
              <Link href="#offers">See What&apos;s Included</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Free Tools Section */}
      <section id="tools" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white text-shadow-ink-40">Free Tools</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <EngagementDiagnosticTool />
          <DMOpenerTool />
          <div className="md:col-span-2">
            <HookRepurposerTool />
          </div>
        </div>
      </section>

      {/* Paid Tools Preview */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white text-shadow-ink-40">Premium Tools</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { title: 'Strategic Engagement Planner', icon: TrendingUp, desc: 'Full breakdown with personalized roadmap' },
            { title: 'Comment Impact Engine', icon: MessageSquare, desc: 'Optimize every comment for maximum impact' },
            { title: 'DM Engine Full Flows', icon: Zap, desc: 'Complete DM sequences and follow-ups' },
            { title: 'Timing Engine', icon: Clock, desc: 'Know exactly when to post and engage' },
            { title: 'Saved Results & Exports', icon: Download, desc: 'Save unlimited runs and export PDFs' },
          ].map((tool, i) => (
            <Card key={i} className="bg-card/80 border-border/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <tool.icon className="h-6 w-6 text-primary" />
                  <Lock className="h-5 w-5 text-card-foreground/50" />
                </div>
                <CardTitle className="text-card-foreground">{tool.title}</CardTitle>
                <CardDescription className="text-card-foreground/70">{tool.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full border-border/60 hover:bg-accent/80">
                  <Link href="#offers">Unlock</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white text-shadow-ink-40">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PlanCard
            title="DM Engine"
            description="Best for confident, non-cringe DMs"
            features={[
              'Unlock DM follow-ups',
              'Full DM flow logic',
              'Unlimited DM tool runs',
              'Copy/export text',
            ]}
            planId="dm_engine"
            highlight={false}
          />
          <PlanCard
            title="The Strategy"
            description="Best for strategic engagement & visibility"
            features={[
              'Full Engagement Diagnostic',
              'Engagement Planner',
              'Comment Impact Engine',
              'Where-to-Engage Finder',
              'Email + PDF exports',
            ]}
            planId="the_strategy"
            highlight={true}
          />
          <PlanCard
            title="All Access"
            description="Everything in DM Engine + The Strategy"
            features={[
              'DM Engine included',
              'The Strategy included',
              'All premium tools',
              'Priority support',
            ]}
            planId="all_access"
            highlight={false}
          />
        </div>
        <div className="mt-8 text-center">
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Secure payments powered by</span>
            <span className="font-semibold text-foreground">Stripe</span>
          </a>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-white text-shadow-ink-40">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="following" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[15px]">Do I need a big following?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                No. These tools work at any follower count. The Strategy is designed to help you build engagement regardless of your current size.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="automation" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[15px]">Is this automation? Will it risk my account?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                No automation. These are strategic frameworks you implement manually. Everything is designed to work within Instagram&apos;s guidelines.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="time" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[17px]">How much time does this take per day?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                The Strategy is designed for 15-30 minutes of focused engagement per day. The tools help you maximize impact in that time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="dm-only" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[15px]">Can I buy DM Engine without The Strategy?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                Yes. DM Engine is a standalone product focused specifically on DM flows and follow-ups. The Strategy is for overall engagement strategy.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="services-vs-products" className="bg-card/80 border-border/60 rounded-lg px-6">
              <AccordionTrigger className="text-card-foreground text-[15px]">What if I&apos;m selling services vs digital products?</AccordionTrigger>
              <AccordionContent className="text-card-foreground text-[15px]">
                The tools adapt to your offer type. DM Engine includes templates for both service-based and product-based businesses.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-white text-shadow-ink-40">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Try the free tools or unlock the full system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-cactus-primary text-white hover:opacity-90 shadow-ink-40">
              <Link href="#tools">Start Free → Get Your Results</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-border/60 hover:bg-accent/60 shadow-ink-40">
              <Link href="#offers">Unlock the Full System</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function EngagementDiagnosticTool() {
  const [inputs, setInputs] = useState({
    followerRange: '',
    postingFrequency: '',
    dailyEngagementTime: '',
    primaryGoal: '',
    biggestFriction: '',
  })
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (!inputs.followerRange || !inputs.postingFrequency || !inputs.dailyEngagementTime || !inputs.primaryGoal || !inputs.biggestFriction) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tools/engagement-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, save: false }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.outputs)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card/80 border-border/60 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="text-card-foreground">Engagement Diagnostic (Lite)</CardTitle>
        <CardDescription className="text-card-foreground/70">Get your engagement tier and one actionable insight.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div>
          <Label className="text-xs text-card-foreground/70">Follower Range</Label>
          <Select value={inputs.followerRange} onChange={(e) => setInputs({ ...inputs, followerRange: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="0-500">0-500</option>
            <option value="500-2k">500-2k</option>
            <option value="2k-10k">2k-10k</option>
            <option value="10k+">10k+</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-card-foreground/70">Posting Frequency</Label>
          <Select value={inputs.postingFrequency} onChange={(e) => setInputs({ ...inputs, postingFrequency: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="rarely">Rarely</option>
            <option value="1-2x/week">1-2x/week</option>
            <option value="3-5x/week">3-5x/week</option>
            <option value="daily-ish">Daily-ish</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-card-foreground/70">Daily Engagement Time</Label>
          <Select value={inputs.dailyEngagementTime} onChange={(e) => setInputs({ ...inputs, dailyEngagementTime: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="0-5">0-5 minutes</option>
            <option value="5-15">5-15 minutes</option>
            <option value="15-30">15-30 minutes</option>
            <option value="30+">30+ minutes</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-card-foreground/70">Primary Goal</Label>
          <Select value={inputs.primaryGoal} onChange={(e) => setInputs({ ...inputs, primaryGoal: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="growth">Growth</option>
            <option value="DMs">DMs</option>
            <option value="sales">Sales</option>
            <option value="authority">Authority</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-card-foreground/70">Biggest Friction</Label>
          <Select value={inputs.biggestFriction} onChange={(e) => setInputs({ ...inputs, biggestFriction: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="no reach">No reach</option>
            <option value="low engagement">Low engagement</option>
            <option value="no DMs">No DMs</option>
            <option value="no sales">No sales</option>
            <option value="burnout">Burnout</option>
          </Select>
        </div>
        <Button onClick={handleRun} disabled={loading} className="w-full mt-1.5" size="sm">
          {loading ? 'Running...' : 'Run Diagnostic'}
        </Button>
        {results && (
          <div className="mt-2 p-2 bg-background/70 rounded-lg border border-border/60">
            <div className="mb-2">
              <span className="text-xs text-white">Engagement Tier:</span>
              <div className="text-base font-bold text-green-500 mt-0.5">{results.engagementTier}</div>
            </div>
            <div className="mb-2">
              <span className="text-xs text-white">Insight:</span>
              <p className="text-xs text-white mt-0.5">{results.insight}</p>
            </div>
            <div className="mb-2">
              <span className="text-xs text-white">Action:</span>
              <p className="text-xs text-white mt-0.5">{results.action}</p>
            </div>
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs text-white mb-2">{results.teaser}</p>
              <Button asChild variant="outline" size="sm" className="w-full border-border/60 text-xs h-8">
                <Link href="/verify">Email me my full breakdown</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DMOpenerTool() {
  const [inputs, setInputs] = useState({
    scenario: '',
    tone: '',
    intent: '',
  })
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleRun = async () => {
    if (!inputs.scenario || !inputs.tone || !inputs.intent) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tools/dm-opener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, save: false }),
      })
      const data = await res.json()
      if (data.success) {
        setResults(data.outputs)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card/80 border-border/60 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <CardTitle className="text-card-foreground">DM Opener Generator (Lite)</CardTitle>
        <CardDescription className="text-card-foreground/70">Generate a DM opener based on your scenario and tone.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div>
          <Label className="text-xs text-card-foreground/70">Scenario</Label>
          <Select value={inputs.scenario} onChange={(e) => setInputs({ ...inputs, scenario: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="commenter">Commenter</option>
            <option value="story reply">Story Reply</option>
            <option value="inbound DM">Inbound DM</option>
            <option value="warm lead">Warm Lead</option>
            <option value="cold-ish lead">Cold-ish Lead</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-card-foreground/70">Tone</Label>
          <Select value={inputs.tone} onChange={(e) => setInputs({ ...inputs, tone: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct</option>
            <option value="playful">Playful</option>
            <option value="professional">Professional</option>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-card-foreground/70">Intent</Label>
          <Select value={inputs.intent} onChange={(e) => setInputs({ ...inputs, intent: e.target.value })} className="mt-0.5 h-8 text-xs">
            <option value="">Select...</option>
            <option value="start convo">Start Conversation</option>
            <option value="qualify">Qualify</option>
            <option value="soft invite">Soft Invite</option>
            <option value="book call">Book Call</option>
          </Select>
        </div>
        <Button onClick={handleRun} disabled={loading} className="w-full mt-1.5" size="sm">
          {loading ? 'Generating...' : 'Generate Opener'}
        </Button>
        {results && (
          <div className="mt-2 p-2 bg-background/70 rounded-lg border border-border/60">
            <div className="mb-2">
              <span className="text-xs text-white">DM Opener:</span>
              <p className="text-xs text-card-foreground mt-1 p-2 bg-card rounded border border-border/60">{results.opener}</p>
            </div>
            <div className="pt-2 border-t border-border/60">
              <p className="text-xs text-white mb-2">{results.followUpHint}</p>
              <Button asChild variant="outline" size="sm" className="w-full border-border/60 text-xs h-8">
                <Link href="/verify">Unlock full DM logic</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function HookRepurposerTool() {
  const [inputs, setInputs] = useState({
    hookInput: '',
    videoContext: '',
    goal: 'Stop the scroll',
    tone: 'Calm',
    platformFocus: 'Reels',
  })
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showWhy, setShowWhy] = useState(false)
  const [remainingToday, setRemainingToday] = useState<number | null>(null)

  const handleRun = async () => {
    if (!inputs.hookInput.trim()) {
      setError('Paste a hook to continue.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tools/hook-repurposer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hookInput: inputs.hookInput,
          videoContext: inputs.videoContext || undefined,
          goal: inputs.goal,
          tone: inputs.tone,
          platformFocus: inputs.platformFocus,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Unable to run tool right now.')
      } else {
        setResults(data.outputs)
        setRemainingToday(data.remainingToday)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card/95 border-border/60 backdrop-blur-sm shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-card-foreground">Hook Repurposer™</CardTitle>
            <CardDescription className="text-card-foreground/70">
              Turn one hook into ten angles that stop the scroll.
            </CardDescription>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-card-foreground/60">
            Strategist mode
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="rounded-md border border-border/60 bg-[#1F3F2A] p-1.5 text-xs text-white">
            This is an AI-guided hook intelligence tool. It reframes ideas with strategy—no copying, no trend-chasing.
          </div>
          <div>
            <Label className="text-xs text-card-foreground/70">Hook input</Label>
            <textarea
              maxLength={200}
              value={inputs.hookInput}
              onChange={(e) => setInputs({ ...inputs, hookInput: e.target.value })}
              placeholder="Paste someone else's hook or your own"
              className="mt-0.5 min-h-[50px] w-full rounded-md border border-input bg-input p-1.5 text-xs text-card-foreground placeholder:text-card-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="mt-2 text-xs text-card-foreground/50">
              Max 200 characters.
            </p>
          </div>
          <div>
            <Label className="text-xs text-card-foreground/70">Video context (optional)</Label>
            <Input
              maxLength={140}
              value={inputs.videoContext}
              onChange={(e) => setInputs({ ...inputs, videoContext: e.target.value })}
              placeholder="Describe what the video shows"
              className="mt-0.5 text-xs h-8"
            />
            <p className="mt-0.5 text-xs text-card-foreground/50">
              Max 140 characters.
            </p>
          </div>
          <div>
            <Label className="text-xs text-card-foreground/70">Goal</Label>
            <Select
              value={inputs.goal}
              onChange={(e) => setInputs({ ...inputs, goal: e.target.value })}
              className="mt-0.5 h-8 text-xs"
            >
              <option>Stop the scroll</option>
              <option>Spark curiosity</option>
              <option>Authority/credibility</option>
              <option>Drive comments</option>
              <option>Drive profile clicks</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-card-foreground/70">Tone</Label>
            <Select
              value={inputs.tone}
              onChange={(e) => setInputs({ ...inputs, tone: e.target.value })}
              className="mt-0.5 h-8 text-xs"
            >
              <option>Calm</option>
              <option>Direct</option>
              <option>Curious</option>
              <option>Bold</option>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-card-foreground/70">Platform focus</Label>
            <Select
              value={inputs.platformFocus}
              onChange={(e) => setInputs({ ...inputs, platformFocus: e.target.value })}
              className="mt-0.5 h-8 text-xs"
            >
              <option>Reels</option>
              <option>TikTok</option>
              <option>Shorts</option>
            </Select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          {remainingToday !== null && (
            <p className="text-xs text-card-foreground/60">
              Remaining today: {remainingToday}
            </p>
          )}
          <Button onClick={handleRun} disabled={loading} className="w-full mt-1.5" size="sm">
            {loading ? 'Generating...' : 'Generate Hook Angles'}
          </Button>
          <p className="text-xs text-card-foreground/60">
            This tool does not copy content. It reframes ideas using strategy, not duplication. Always adapt hooks to your own voice.
          </p>
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-card-foreground">How this reframes your hook</h4>
            {results ? (
              <div className="mt-1.5 space-y-1.5">
                {results.hooks?.map((hook: any, index: number) => (
                  <div key={`${hook.angle}-${index}`} className="rounded-md border border-border/60 bg-background/60 p-1.5">
                    <div className="text-xs uppercase tracking-[0.2em] text-white/70">
                      {hook.angle}
                    </div>
                    <p className="mt-0.5 text-xs text-white">{hook.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-card-foreground">
                Paste a hook to see 6–8 reframes by angle.
              </p>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowWhy((prev) => !prev)}
              className="text-xs text-card-foreground underline-offset-4 hover:underline"
            >
              Why this works
            </button>
            {showWhy && (
              <p className="mt-1.5 text-xs text-card-foreground">
                {results?.explanation || 'Run the tool to see the reasoning behind the strongest angle.'}
              </p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-card-foreground">Visual pairing ideas</h4>
            {results ? (
              <div className="mt-1.5 space-y-1.5">
                <div>
                  <p className="text-xs text-card-foreground">B-roll ideas</p>
                  <ul className="mt-1 space-y-1 text-xs text-card-foreground">
                    {results.visualSuggestions?.bRoll?.map((item: string, index: number) => (
                      <li key={`broll-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-card-foreground">Alternate concepts</p>
                  <ul className="mt-1 space-y-1 text-xs text-card-foreground">
                    {results.visualSuggestions?.alternatives?.map((item: string, index: number) => (
                      <li key={`alt-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-card-foreground">
                Add context to get tailored visual pairing ideas.
              </p>
            )}
          </div>
          <div className="rounded-md border border-border/60 bg-background/60 p-2 text-white">
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              <Lock className="h-3 w-3" />
              <span>Hook sequences (3-part openers)</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/80">
              <Lock className="h-3 w-3" />
              <span>Comment-bait vs authority versions</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/80">
              <Lock className="h-3 w-3" />
              <span>CTA-aligned hooks (DM / profile click)</span>
            </div>
            <Button asChild size="sm" className="mt-2 w-full text-xs">
              <Link href="#offers">Unlock full hook systems in The Strategy</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PlanCard({ title, description, features, planId, highlight }: any) {
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (res.status === 401) {
        setError('Verify your email to continue.')
        window.location.href = '/verify'
        return
      }
      if (!res.ok) {
        const errorMsg = data?.error || data?.details || 'Checkout is unavailable right now.'
        console.error('[checkout] Error:', errorMsg, data)
        setError(errorMsg)
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Checkout is unavailable right now.')
      }
    } catch (error: any) {
      console.error('[checkout] Exception:', error)
      setError(error?.message || 'Failed to create checkout session. Please try again.')
    }
  }

  return (
    <Card className={`bg-card/80 border-border/60 backdrop-blur-sm shadow-sm ${highlight ? 'border-primary/60 ring-2 ring-primary/20' : ''}`}>
      <CardHeader>
        <CardTitle className="text-card-foreground">{title}</CardTitle>
        <CardDescription className="text-card-foreground/70">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-start text-card-foreground/70">
              <span className="mr-2 text-primary">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <Button
          onClick={handleCheckout}
          className={highlight ? 'w-full bg-cactus-primary text-white hover:opacity-90' : 'w-full'}
          variant={highlight ? 'default' : 'outline'}
        >
          Get {title}
        </Button>
        {error && (
          <p className="mt-3 text-xs text-red-600">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}
