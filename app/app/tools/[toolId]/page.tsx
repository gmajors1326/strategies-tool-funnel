import { notFound } from 'next/navigation'
import ToolRunner from '@/components/app/ToolRunner'
import { getToolMeta } from '@/src/lib/tools/registry'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'

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

  const session = await requireUser()
  const entitlement = await getOrCreateEntitlement(session.id)
  const planId = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'

  const mode = readParam(searchParams, 'mode')
  const trialMode = readParam(searchParams, 'trialMode')

  return (
    <section className="space-y-4">
      <ToolRunner
        toolId={tool.id}
        planId={planId}
        defaultMode={mode === 'trial' ? 'trial' : 'paid'}
        defaultTrialMode={trialMode === 'preview' ? 'preview' : trialMode === 'live' ? 'live' : 'sandbox'}
      />
    </section>
  )
}
