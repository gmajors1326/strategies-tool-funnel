import { notFound } from 'next/navigation'
import ToolRunner from '@/src/components/tools/ToolRunner'
import { getToolMeta } from '@/src/lib/tools/registry'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: { toolId: string }
  searchParams?: Record<string, string | string[] | undefined>
}

function readParam(searchParams: PageProps['searchParams'], key: string) {
  const v = searchParams?.[key]
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}

export default async function ToolDetailPage({ params, searchParams }: PageProps) {
  let tool
  try {
    tool = getToolMeta(params.toolId)
  } catch {
    return notFound()
  }

  const mode = readParam(searchParams, 'mode')
  const trialMode = readParam(searchParams, 'trialMode')

  return (
    <section className="space-y-4">
      <ToolRunner
        toolId={tool.id}
        defaultMode={mode === 'trial' ? 'trial' : 'paid'}
        defaultTrialMode={trialMode === 'preview' ? 'preview' : trialMode === 'live' ? 'live' : 'sandbox'}
      />
    </section>
  )
}
