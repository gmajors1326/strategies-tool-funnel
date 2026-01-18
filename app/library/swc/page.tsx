'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock } from 'lucide-react'
import Link from 'next/link'

export default function SWCLibraryPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check access - in a real app, this would check entitlements
    // For now, we'll show locked state
    setHasAccess(false)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="relative min-h-screen bg-hero-cactus text-foreground flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
        <div className="relative text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="relative min-h-screen bg-hero-cactus text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <Lock className="h-16 w-16 text-foreground/60 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4 text-foreground">SWC Library</h1>
            <p className="text-xl text-muted-foreground mb-8">
              The conversion layer—turning conversations into revenue. SWC is available with All Access.
            </p>
            <Card className="bg-card/95 border-border/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle className="text-card-foreground">Unlock SWC</CardTitle>
                <CardDescription className="text-card-foreground/70">
                  Get All Access to unlock the SWC library, including conversion templates, objection handling, and revenue frameworks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/#offers">View All Access Plan</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-hero-cactus text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">SWC Library</h1>
          <p className="text-xl text-muted-foreground mb-12">
            The conversion layer—turning conversations into revenue.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Conversion Templates', desc: 'Ready-to-use templates for common scenarios' },
              { title: 'Objection Handling', desc: 'Responses to common objections and concerns' },
              { title: 'Revenue Frameworks', desc: 'Systematic approaches to closing sales' },
              { title: 'Follow-up Sequences', desc: 'Multi-step sequences for nurturing leads' },
            ].map((module, i) => (
              <Card key={i} className="bg-card/95 border-border/60 backdrop-blur-sm shadow-sm">
                <CardHeader>
                  <CardTitle className="text-card-foreground">{module.title}</CardTitle>
                  <CardDescription className="text-card-foreground/70">{module.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-border/60">
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
