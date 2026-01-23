import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="relative min-h-screen bg-hero-cactus text-foreground flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
      <Card className="relative w-full max-w-md bg-card/95 border-border/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <CardTitle className="text-card-foreground">Payment Successful</CardTitle>
          <CardDescription className="text-card-foreground/70">
            Thank you for your purchase. Your account has been upgraded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-card-foreground/70 text-center">
            You now have access to all premium tools and features.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/account">Go to Account</Link>
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
