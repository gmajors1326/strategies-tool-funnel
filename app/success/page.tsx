'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // In a real app, you might want to verify the session with Stripe
    // For now, we'll just show success
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <CardTitle className="text-slate-100">Payment Successful</CardTitle>
          <CardDescription className="text-slate-400">
            Thank you for your purchase. Your account has been upgraded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300 text-center">
            You now have access to all premium tools and features.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/account">Go to Account</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-slate-600">
              <Link href="/">Back to Tools</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
