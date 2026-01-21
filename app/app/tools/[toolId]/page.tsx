import { notFound } from 'next/navigation'
import ToolDetailForm from '@/src/components/tools/ToolDetailForm'
import { findToolById } from '@/src/lib/tools/registry'
import { getToolSchema } from '@/src/lib/tools/toolSchemas'

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
  const tool = findToolById(params.toolId)
  if (!tool) return notFound()

  const schemaDef = getToolSchema(tool.id)

  const mode = readParam(searchParams, 'mode')
  const trialMode = readParam(searchParams, 'trialMode')

  return (
    <section className="space-y-4">
      <ToolDetailForm
        toolId={tool.id}
        toolName={tool.name}
        description={schemaDef?.description}
        schemaDef={schemaDef}
        defaultMode={mode === 'trial' ? 'trial' : 'paid'}
        defaultTrialMode={trialMode === 'preview' ? 'preview' : trialMode === 'live' ? 'live' : 'sandbox'}
      />
    </section>
  )
}
