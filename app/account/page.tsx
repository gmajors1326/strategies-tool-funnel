'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { AppPanel } from '@/components/ui/AppPanel'
import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'

interface ToolRun {
  id: string
  toolKey: string
  inputsJson: any
  outputsJson: any
  createdAt: string
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  readAt?: string | null
  createdAt: string
}

export default function AccountPage() {
  const router = useRouter()
  const [toolRuns, setToolRuns] = useState<ToolRun[]>([])
  const [plan] = useState<string>('FREE')
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [digestFrequency, setDigestFrequency] = useState<'none' | 'daily' | 'weekly'>('weekly')
  const [savingPrefs, setSavingPrefs] = useState(false)

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

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error(error)
    }
  }, [])

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/preferences')
      if (res.ok) {
        const data = await res.json()
        setDigestFrequency(data.preference || 'weekly')
      }
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    fetchToolRuns()
    fetchNotifications()
    fetchPreferences()
  }, [fetchToolRuns, fetchNotifications, fetchPreferences])

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
    } catch (error) {
      console.error(error)
    }
  }

  const handleDigestChange = async (value: 'none' | 'daily' | 'weekly') => {
    setDigestFrequency(value)
    setSavingPrefs(true)
    try {
      await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestFrequency: value }),
      })
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPrefs(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-hero-cactus text-foreground flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
        <div className="relative text-[hsl(var(--muted))]">Loading...</div>
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
          <AppCard className="mb-8">
            <AppCardHeader>
              <AppCardTitle>Your Plan</AppCardTitle>
              <AppCardDescription>
                Current plan: {plan === 'FREE' ? '7-Day Free Trial' : plan.replace('_', ' ')}
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent>
              {plan === 'FREE' && (
                <div>
                  <p className="text-[hsl(var(--muted))] mb-4">
                    Upgrade to keep access after your 7-day trial ends.
                  </p>
                  <Button asChild>
                    <Link href="/#offers">View Plans</Link>
                  </Button>
                </div>
              )}
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/account/usage">View usage</Link>
                </Button>
              </div>
            </AppCardContent>
          </AppCard>

          {/* Saved Results */}
          <AppCard>
            <AppCardHeader>
              <AppCardTitle>Saved Results</AppCardTitle>
              <AppCardDescription>
                {toolRuns.length === 0 
                  ? 'No saved results yet. Run a tool and save your results to see them here.'
                  : `${toolRuns.length} saved result${toolRuns.length !== 1 ? 's' : ''}`
                }
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent>
              {toolRuns.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-[hsl(var(--muted))] mx-auto mb-4" />
                  <p className="text-[hsl(var(--muted))] mb-4">No saved results yet</p>
                  <Button asChild variant="outline">
                    <Link href="/">Start 7-day trial</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {toolRuns.map((run) => (
                    <AppCard key={run.id}>
                      <AppCardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[hsl(var(--text))] capitalize">
                              {run.toolKey.replace(/-/g, ' ')}
                            </h3>
                            <p className="text-sm text-[hsl(var(--muted))]">
                              {new Date(run.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {plan === 'FREE' && (
                            <Lock className="h-5 w-5 text-[hsl(var(--muted))]" />
                          )}
                        </div>
                        {run.outputsJson && (
                          <AppPanel className="mt-4">
                            <pre className="whitespace-pre-wrap text-xs text-[hsl(var(--text))]">
                              {JSON.stringify(run.outputsJson, null, 2)}
                            </pre>
                          </AppPanel>
                        )}
                      </AppCardContent>
                    </AppCard>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>

          <AppCard className="mt-8">
            <AppCardHeader>
              <AppCardTitle>Notifications</AppCardTitle>
              <AppCardDescription>
                Event alerts and digest preferences.
              </AppCardDescription>
            </AppCardHeader>
            <AppCardContent>
              <div className="mb-4">
                <p className="text-sm text-[hsl(var(--muted))] mb-2">Digest frequency</p>
                <div className="flex flex-wrap gap-2">
                  {(['none', 'daily', 'weekly'] as const).map((option) => (
                    <Button
                      key={option}
                      size="sm"
                      variant={digestFrequency === option ? 'default' : 'outline'}
                      onClick={() => handleDigestChange(option)}
                      disabled={savingPrefs}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              {notifications.length === 0 ? (
                <AppPanel variant="subtle" className="p-4">
                  <p className="text-sm text-[hsl(var(--muted))]">No notifications yet.</p>
                </AppPanel>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <AppPanel key={notification.id} className="p-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[hsl(var(--text))]">{notification.title}</p>
                        <p className="text-xs text-[hsl(var(--muted))] mt-1">{notification.message}</p>
                        <p className="text-xs text-[hsl(var(--muted))] mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.readAt && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkRead(notification.id)}>
                          Mark read
                        </Button>
                      )}
                    </AppPanel>
                  ))}
                </div>
              )}
            </AppCardContent>
          </AppCard>

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
