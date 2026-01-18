'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="relative min-h-screen bg-hero-cactus text-foreground flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
      <Card className="relative w-full max-w-md bg-card/95 border-border/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 text-card-foreground/50 mx-auto mb-4" />
          <CardTitle className="text-card-foreground">Payment Cancelled</CardTitle>
          <CardDescription className="text-card-foreground/70">
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-card-foreground/70 text-center">
            You can continue using the free tools, or try again when you&apos;re ready.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/#offers">View Plans</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-border/60">
              <Link href="/">Back to Tools</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
