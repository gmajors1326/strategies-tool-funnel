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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <Lock className="h-16 w-16 text-slate-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4 text-slate-100">SWC Library</h1>
            <p className="text-xl text-slate-300 mb-8">
              The conversion layer—turning conversations into revenue. SWC is available with All Access.
            </p>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-100">Unlock SWC</CardTitle>
                <CardDescription className="text-slate-400">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-slate-100">SWC Library</h1>
          <p className="text-xl text-slate-300 mb-12">
            The conversion layer—turning conversations into revenue.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Conversion Templates', desc: 'Ready-to-use templates for common scenarios' },
              { title: 'Objection Handling', desc: 'Responses to common objections and concerns' },
              { title: 'Revenue Frameworks', desc: 'Systematic approaches to closing sales' },
              { title: 'Follow-up Sequences', desc: 'Multi-step sequences for nurturing leads' },
            ].map((module, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-slate-100">{module.title}</CardTitle>
                  <CardDescription className="text-slate-400">{module.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-slate-600">
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
