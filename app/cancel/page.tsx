'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <CardTitle className="text-slate-100">Payment Cancelled</CardTitle>
          <CardDescription className="text-slate-400">
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-300 text-center">
            You can continue using the free tools, or try again when you're ready.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/#offers">View Plans</Link>
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
