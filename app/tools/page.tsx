import Link from 'next/link'
import { getAllTools } from '@/src/lib/tools/getToolBySlug'
import { LAUNCH_TOOL_IDS } from '@/src/lib/tools/launchTools'
import { AdminShell } from '@/src/components/layout/AdminShell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function ToolsIndexPage() {
  const tools = getAllTools()
  const cardClass = ""

  return (
    <AdminShell
      sidebar={<div className="p-4 text-sm text-slate-400">Sidebar later</div>}
      header={<div className="text-sm">Tools</div>}
    >
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Tools</h1>
        <p className="text-sm text-slate-400">
          Browse tool detail pages. The runner lives inside the app experience.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const isLaunch = (LAUNCH_TOOL_IDS as readonly string[]).includes(tool.id)
          const highlightClass = isLaunch
            ? 'ring-1 ring-emerald-400/60 shadow-[0_0_28px_rgba(80,200,120,0.35)]'
            : ''
          return (
          <Link key={tool.id} href={`/tools/${tool.slug}`} className="block">
            <Card className={`h-full transition ${cardClass} ${highlightClass}`}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-100">{tool.name}</h2>
                  {tool.isFree ? <Badge>Free</Badge> : null}
                  {isLaunch ? <Badge>Available now</Badge> : null}
                </div>
                <p className="text-sm text-slate-400">{tool.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{tool.tokensCost ?? 0} tokens</span>
                  {tool.category ? <Badge variant="secondary">{tool.category}</Badge> : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        )})}
      </div>
    </AdminShell>
  )
}
