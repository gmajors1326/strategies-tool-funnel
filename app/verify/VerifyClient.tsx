'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AppCard, AppCardContent, AppCardDescription, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard'
import { AppPanel } from '@/components/ui/AppPanel'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'start' | 'verify'>('start')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nextParam = searchParams.get('next') ?? ''
  const nextPath =
    nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/account'

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStep('verify')
      } else {
        if (data.code === 'email_not_configured') {
          setError(
            'Email provider is not configured. Set RESEND_API_KEY or enable Gmail SMTP.'
          )
        } else {
          setError(data.error || 'Failed to send verification code')
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push(nextPath)
      } else {
        setError(data.error || 'Invalid code')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-hero-cactus text-foreground flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
      <AppCard className="relative w-full max-w-md">
        <AppCardHeader>
          <AppCardTitle>Email Verification</AppCardTitle>
          <AppCardDescription>
            {step === 'start'
              ? 'Enter your details to receive a verification code'
              : 'Enter the 6-digit code sent to your email'}
          </AppCardDescription>
        </AppCardHeader>
        <AppCardContent>
          {step === 'start' ? (
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-[hsl(var(--muted))]">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                  placeholder="Your name"
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
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="code" className="text-[hsl(var(--muted))]">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="mt-1 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
                <p className="text-xs text-[hsl(var(--muted))] mt-2">Check your email for the 6-digit code</p>
              </div>
              {error && (
                <AppPanel className="border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10">
                  <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
                </AppPanel>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('start')} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </form>
          )}
        </AppCardContent>
      </AppCard>
    </div>
  )
}
