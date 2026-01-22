import Link from 'next/link'
import { getAllTools } from '@/src/lib/tools/getToolBySlug'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default function ToolsIndexPage() {
  const tools = getAllTools()

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tools</h1>
        <p className="text-sm text-muted-foreground">
          Browse tool detail pages. The runner lives inside the app experience.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.id} href={`/tools/${tool.slug}`} className="block">
            <Card className="h-full transition hover:border-[hsl(var(--border))]">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{tool.name}</h2>
                  {tool.isFree ? <Badge>Free</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{tool.tokensCost ?? 0} tokens</span>
                  {tool.category ? <Badge variant="secondary">{tool.category}</Badge> : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
