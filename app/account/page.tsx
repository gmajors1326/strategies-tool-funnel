'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'

interface ToolRun {
  id: string
  toolKey: string
  inputsJson: any
  outputsJson: any
  createdAt: string
}

export default function AccountPage() {
  const router = useRouter()
  const [toolRuns, setToolRuns] = useState<ToolRun[]>([])
  const [plan, setPlan] = useState<string>('FREE')
  const [loading, setLoading] = useState(true)

  const fetchToolRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/tool-runs')
      if (res.ok) {
        const data = await res.json()
        setToolRuns(data.toolRuns || [])
      } else if (res.status === 401) {
        router.push('/verify')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchToolRuns()
  }, [fetchToolRuns])

  if (loading) {
    return (
      <div className="relative min-h-screen bg-hero-cactus text-foreground flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
        <div className="relative text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-hero-cactus text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-white text-shadow-ink-40">Account</h1>

          {/* Plan Status */}
          <Card className="bg-card/95 border-border/60 backdrop-blur-sm mb-8 shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Your Plan</CardTitle>
              <CardDescription className="text-card-foreground/70">
                Current plan: {plan === 'FREE' ? 'Free' : plan.replace('_', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plan === 'FREE' && (
                <div>
                  <p className="text-card-foreground/70 mb-4">Upgrade to unlock premium tools and unlimited saves.</p>
                  <Button asChild>
                    <Link href="/#offers">View Plans</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Results */}
          <Card className="bg-card/95 border-border/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-card-foreground">Saved Results</CardTitle>
              <CardDescription className="text-card-foreground/70">
                {toolRuns.length === 0 
                  ? 'No saved results yet. Run a tool and save your results to see them here.'
                  : `${toolRuns.length} saved result${toolRuns.length !== 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {toolRuns.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-card-foreground/40 mx-auto mb-4" />
                  <p className="text-card-foreground/60 mb-4">No saved results yet</p>
                  <Button asChild variant="outline">
                    <Link href="/">Try Free Tools</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {toolRuns.map((run) => (
                    <Card key={run.id} className="bg-card/90 border-border/60">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-card-foreground capitalize">
                              {run.toolKey.replace('-', ' ')}
                            </h3>
                            <p className="text-sm text-card-foreground/60">
                              {new Date(run.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {plan === 'FREE' && (
                            <Lock className="h-5 w-5 text-card-foreground/40" />
                          )}
                        </div>
                        {run.outputsJson && (
                          <div className="mt-4 p-4 bg-background/40 rounded border border-border/60">
                            {run.toolKey === 'engagement-diagnostic' && (
                              <div>
                                <p className="text-sm text-card-foreground/60 mb-2">Engagement Tier:</p>
                                <p className="text-lg font-semibold text-primary mb-4">
                                  {run.outputsJson.engagementTier}
                                </p>
                                <p className="text-sm text-card-foreground/60 mb-2">Insight:</p>
                                <p className="text-card-foreground/80 mb-4">{run.outputsJson.insight}</p>
                                <p className="text-sm text-card-foreground/60 mb-2">Action:</p>
                                <p className="text-card-foreground/80">{run.outputsJson.action}</p>
                              </div>
                            )}
                            {run.toolKey === 'dm-opener' && (
                              <div>
                                <p className="text-sm text-card-foreground/60 mb-2">DM Opener:</p>
                                <p className="text-card-foreground/80 p-3 bg-card rounded border border-border/60">
                                  {run.outputsJson.opener}
                                </p>
                              </div>
                            )}
                            {run.toolKey === 'hook-repurposer' && (
                              <div>
                                <p className="text-sm text-card-foreground/60 mb-2">Hook angles:</p>
                                <div className="space-y-3">
                                  {(run.outputsJson.hooks || []).slice(0, 3).map((hook: any, index: number) => (
                                    <div key={`${hook.angle}-${index}`} className="rounded-md border border-border/60 bg-background/50 p-3">
                                      <p className="text-xs uppercase tracking-[0.2em] text-card-foreground/60">
                                        {hook.angle}
                                      </p>
                                      <p className="mt-2 text-card-foreground/80">{hook.text}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/">Back to Tools</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
