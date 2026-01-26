'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { AppPanel } from '@/components/ui/AppPanel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyClient() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const nextPath = '/'

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!name.trim()) {
        setError('Please enter your name.')
        setLoading(false)
        return
      }
      if (!email.trim()) {
        setError('Please enter your email.')
        setLoading(false)
        return
      }
      const res = await fetch('/api/auth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, next: nextPath }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSent(true)
      } else {
        if (data.code === 'email_not_configured') {
          setError('Email provider is not configured. Set RESEND_API_KEY or enable Gmail SMTP.')
        } else {
          setError(data.error || 'Failed to send sign-in link')
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#6b8b62] text-foreground flex items-center justify-center p-4">
      <AppCard className="relative w-full max-w-md">
        <AppCardHeader>
          <AppCardTitle>Email Sign-In</AppCardTitle>
          <AppCardDescription>
            {sent
              ? 'Check your inbox for a secure sign-in link.'
              : 'Enter your email to receive a sign-in link.'}
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent>
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-[hsl(var(--muted))]">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-[hsl(var(--muted))]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="your@email.com"
              />
            </div>
            {error && (
              <AppPanel className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10">
                <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
              </AppPanel>
            )}
            <Button type="submit" disabled={loading || sent} className="w-full">
              {sent ? 'Link sent' : loading ? 'Sending...' : 'Send Sign-In Link'}
            </Button>
          </form>
        </AppCardContent>
      </AppCard>
    </div>
  )
}
