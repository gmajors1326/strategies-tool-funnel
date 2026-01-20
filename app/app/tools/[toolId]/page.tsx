import { notFound } from 'next/navigation'
import { fetchUiConfig } from '@/src/lib/ui/fetchUiConfig'
import { ToolPageClient } from '@/src/components/tools/ToolPageClient'

export const dynamic = 'force-dynamic'

type ToolPageProps = {
  params: { toolId: string }
  searchParams?: { mode?: string; trialMode?: string }
}

const toTitle = (toolId: string) =>
  toolId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export default async function ToolPage({ params, searchParams }: ToolPageProps) {
  const uiConfig = await fetchUiConfig()
  const tool = uiConfig.catalog.find((item) => item.id === params.toolId)

  if (!tool) {
    return notFound()
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{toTitle(params.toolId)}</h1>
        <p className="text-sm text-[hsl(var(--muted))]">
          Mode: {searchParams?.mode ?? 'paid'} {searchParams?.trialMode ? `(${searchParams?.trialMode})` : ''}
        </p>
      </div>

      <ToolPageClient tool={tool} mode={searchParams?.mode} trialMode={searchParams?.trialMode} />
    </section>
  )
}
