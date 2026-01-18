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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            The Strategy Tools
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Strategic engagement tools that turn conversations into revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="#tools">Try Free Tools</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800">
              <Link href="#offers">See What&apos;s Included</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Free Tools Section */}
      <section id="tools" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-slate-100">Free Tools</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <EngagementDiagnosticTool />
          <DMOpenerTool />
        </div>
      </section>

      {/* Paid Tools Preview */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-slate-100">Premium Tools</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { title: 'Strategic Engagement Planner', icon: TrendingUp, desc: 'Full breakdown with personalized roadmap' },
            { title: 'Comment Impact Engine', icon: MessageSquare, desc: 'Optimize every comment for maximum impact' },
            { title: 'DM Engine Full Flows', icon: Zap, desc: 'Complete DM sequences and follow-ups' },
            { title: 'Timing Engine', icon: Clock, desc: 'Know exactly when to post and engage' },
            { title: 'Saved Results & Exports', icon: Download, desc: 'Save unlimited runs and export PDFs' },
          ].map((tool, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <tool.icon className="h-6 w-6 text-purple-400" />
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <CardTitle className="text-slate-100">{tool.title}</CardTitle>
                <CardDescription className="text-slate-400">{tool.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-slate-600 hover:bg-slate-700">
                  Unlock
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Offers Section */}
      <section id="offers" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-slate-100">Choose Your Plan</h2>
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
            description="Everything + SWC library"
            features={[
              'DM Engine included',
              'The Strategy included',
              'SWC library access',
              'All premium tools',
              'Priority support',
            ]}
            planId="all_access"
            highlight={false}
          />
        </div>
      </section>

      {/* SWC Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-700/50 backdrop-blur-sm max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-slate-100">SWC: The Conversion Layer</CardTitle>
            <CardDescription className="text-slate-300 text-lg">
              Turning conversations into revenue. SWC is the conversion layer—the bridge between engagement and sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 mb-4">
              SWC is Step 2, not a parallel course. It builds on The Strategy by showing you exactly how to convert the engagement you&apos;re building into actual revenue.
            </p>
            <p className="text-slate-400 text-sm">
              Available with All Access only.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-slate-100">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="following" className="bg-slate-800/50 border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-slate-100">Do I need a big following?</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                No. These tools work at any follower count. The Strategy is designed to help you build engagement regardless of your current size.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="automation" className="bg-slate-800/50 border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-slate-100">Is this automation? Will it risk my account?</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                No automation. These are strategic frameworks you implement manually. Everything is designed to work within Instagram&apos;s guidelines.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="time" className="bg-slate-800/50 border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-slate-100">How much time does this take per day?</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                The Strategy is designed for 15-30 minutes of focused engagement per day. The tools help you maximize impact in that time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="dm-only" className="bg-slate-800/50 border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-slate-100">Can I buy DM Engine without The Strategy?</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                Yes. DM Engine is a standalone product focused specifically on DM flows and follow-ups. The Strategy is for overall engagement strategy.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="swc-fit" className="bg-slate-800/50 border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-slate-100">Where does SWC fit?</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                SWC is the conversion layer. It&apos;s Step 2 after The Strategy—showing you how to turn the engagement you&apos;re building into revenue. It&apos;s included with All Access.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="services-vs-products" className="bg-slate-800/50 border-slate-700 rounded-lg px-6">
              <AccordionTrigger className="text-slate-100">What if I&apos;m selling services vs digital products?</AccordionTrigger>
              <AccordionContent className="text-slate-300">
                The tools adapt to your offer type. DM Engine includes templates for both service-based and product-based businesses. SWC covers conversion strategies for both.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-slate-100">Ready to Get Started?</h2>
              <p className="text-xl text-slate-300 mb-8">
            Try the free tools or unlock the full system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Link href="#tools">Start Free → Get Your Results</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800">
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
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-slate-100">Engagement Diagnostic (Lite)</CardTitle>
        <CardDescription className="text-slate-400">Get your engagement tier and one actionable insight.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-slate-300">Follower Range</Label>
          <Select value={inputs.followerRange} onChange={(e) => setInputs({ ...inputs, followerRange: e.target.value })}>
            <option value="">Select...</option>
            <option value="0-500">0-500</option>
            <option value="500-2k">500-2k</option>
            <option value="2k-10k">2k-10k</option>
            <option value="10k+">10k+</option>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Posting Frequency</Label>
          <Select value={inputs.postingFrequency} onChange={(e) => setInputs({ ...inputs, postingFrequency: e.target.value })}>
            <option value="">Select...</option>
            <option value="rarely">Rarely</option>
            <option value="1-2x/week">1-2x/week</option>
            <option value="3-5x/week">3-5x/week</option>
            <option value="daily-ish">Daily-ish</option>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Daily Engagement Time</Label>
          <Select value={inputs.dailyEngagementTime} onChange={(e) => setInputs({ ...inputs, dailyEngagementTime: e.target.value })}>
            <option value="">Select...</option>
            <option value="0-5">0-5 minutes</option>
            <option value="5-15">5-15 minutes</option>
            <option value="15-30">15-30 minutes</option>
            <option value="30+">30+ minutes</option>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Primary Goal</Label>
          <Select value={inputs.primaryGoal} onChange={(e) => setInputs({ ...inputs, primaryGoal: e.target.value })}>
            <option value="">Select...</option>
            <option value="growth">Growth</option>
            <option value="DMs">DMs</option>
            <option value="sales">Sales</option>
            <option value="authority">Authority</option>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Biggest Friction</Label>
          <Select value={inputs.biggestFriction} onChange={(e) => setInputs({ ...inputs, biggestFriction: e.target.value })}>
            <option value="">Select...</option>
            <option value="no reach">No reach</option>
            <option value="low engagement">Low engagement</option>
            <option value="no DMs">No DMs</option>
            <option value="no sales">No sales</option>
            <option value="burnout">Burnout</option>
          </Select>
        </div>
        <Button onClick={handleRun} disabled={loading} className="w-full">
          {loading ? 'Running...' : 'Run Diagnostic'}
        </Button>
        {results && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="mb-4">
              <span className="text-sm text-slate-400">Engagement Tier:</span>
              <div className="text-2xl font-bold text-purple-400 mt-1">{results.engagementTier}</div>
            </div>
            <div className="mb-4">
              <span className="text-sm text-slate-400">Insight:</span>
              <p className="text-slate-200 mt-1">{results.insight}</p>
            </div>
            <div className="mb-4">
              <span className="text-sm text-slate-400">Action:</span>
              <p className="text-slate-200 mt-1">{results.action}</p>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400">{results.teaser}</p>
              <Button asChild variant="outline" className="mt-3 w-full border-slate-600">
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
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-slate-100">DM Opener Generator (Lite)</CardTitle>
        <CardDescription className="text-slate-400">Generate a DM opener based on your scenario and tone.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-slate-300">Scenario</Label>
          <Select value={inputs.scenario} onChange={(e) => setInputs({ ...inputs, scenario: e.target.value })}>
            <option value="">Select...</option>
            <option value="commenter">Commenter</option>
            <option value="story reply">Story Reply</option>
            <option value="inbound DM">Inbound DM</option>
            <option value="warm lead">Warm Lead</option>
            <option value="cold-ish lead">Cold-ish Lead</option>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Tone</Label>
          <Select value={inputs.tone} onChange={(e) => setInputs({ ...inputs, tone: e.target.value })}>
            <option value="">Select...</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct</option>
            <option value="playful">Playful</option>
            <option value="professional">Professional</option>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Intent</Label>
          <Select value={inputs.intent} onChange={(e) => setInputs({ ...inputs, intent: e.target.value })}>
            <option value="">Select...</option>
            <option value="start convo">Start Conversation</option>
            <option value="qualify">Qualify</option>
            <option value="soft invite">Soft Invite</option>
            <option value="book call">Book Call</option>
          </Select>
        </div>
        <Button onClick={handleRun} disabled={loading} className="w-full">
          {loading ? 'Generating...' : 'Generate Opener'}
        </Button>
        {results && (
          <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="mb-4">
              <span className="text-sm text-slate-400">DM Opener:</span>
              <p className="text-slate-200 mt-2 p-3 bg-slate-800 rounded border border-slate-700">{results.opener}</p>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-3">{results.followUpHint}</p>
              <Button asChild variant="outline" className="w-full border-slate-600">
                <Link href="/verify">Unlock full DM logic</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PlanCard({ title, description, features, planId, highlight }: any) {
  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Card className={`bg-slate-800/50 border-slate-700 backdrop-blur-sm ${highlight ? 'border-purple-500 ring-2 ring-purple-500/50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-slate-100">{title}</CardTitle>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature: string, i: number) => (
            <li key={i} className="flex items-start text-slate-300">
              <span className="mr-2 text-purple-400">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <Button onClick={handleCheckout} className="w-full" variant={highlight ? 'default' : 'outline'}>
          Get {title}
        </Button>
      </CardContent>
    </Card>
  )
}
