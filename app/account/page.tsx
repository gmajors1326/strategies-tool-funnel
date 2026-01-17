'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetchToolRuns()
  }, [])

  const fetchToolRuns = async () => {
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-slate-100">Account</h1>

          {/* Plan Status */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-slate-100">Your Plan</CardTitle>
              <CardDescription className="text-slate-400">
                Current plan: {plan === 'FREE' ? 'Free' : plan.replace('_', ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plan === 'FREE' && (
                <div>
                  <p className="text-slate-300 mb-4">Upgrade to unlock premium tools and unlimited saves.</p>
                  <Button asChild>
                    <Link href="/#offers">View Plans</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Results */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-100">Saved Results</CardTitle>
              <CardDescription className="text-slate-400">
                {toolRuns.length === 0 
                  ? 'No saved results yet. Run a tool and save your results to see them here.'
                  : `${toolRuns.length} saved result${toolRuns.length !== 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {toolRuns.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">No saved results yet</p>
                  <Button asChild variant="outline">
                    <Link href="/">Try Free Tools</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {toolRuns.map((run) => (
                    <Card key={run.id} className="bg-slate-900/50 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-100 capitalize">
                              {run.toolKey.replace('-', ' ')}
                            </h3>
                            <p className="text-sm text-slate-400">
                              {new Date(run.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {plan === 'FREE' && (
                            <Lock className="h-5 w-5 text-slate-600" />
                          )}
                        </div>
                        {run.outputsJson && (
                          <div className="mt-4 p-4 bg-slate-800/50 rounded border border-slate-700">
                            {run.toolKey === 'engagement-diagnostic' && (
                              <div>
                                <p className="text-sm text-slate-400 mb-2">Engagement Tier:</p>
                                <p className="text-lg font-semibold text-purple-400 mb-4">
                                  {run.outputsJson.engagementTier}
                                </p>
                                <p className="text-sm text-slate-400 mb-2">Insight:</p>
                                <p className="text-slate-300 mb-4">{run.outputsJson.insight}</p>
                                <p className="text-sm text-slate-400 mb-2">Action:</p>
                                <p className="text-slate-300">{run.outputsJson.action}</p>
                              </div>
                            )}
                            {run.toolKey === 'dm-opener' && (
                              <div>
                                <p className="text-sm text-slate-400 mb-2">DM Opener:</p>
                                <p className="text-slate-300 p-3 bg-slate-900 rounded border border-slate-700">
                                  {run.outputsJson.opener}
                                </p>
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
