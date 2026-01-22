import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getToolBySlug } from '@/src/lib/tools/getToolBySlug'
import { ToolHeader } from '@/src/components/tools/ToolHeader'
import { ToolCTA } from '@/src/components/tools/ToolCTA'
import { ToolPreview } from '@/src/components/tools/ToolPreview'
import { Card, CardContent } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

type UiTool = {
  id: string
  lockState?: 'available' | 'trial' | 'limited' | 'locked' | 'disabled'
  reason?: string
}

type UiConfig = {
  usage?: { resetsAtISO?: string }
  catalogTools?: UiTool[]
}

function formatResetAt(input?: string | null) {
  if (!input) return null
  try {
    const d = new Date(input)
    if (Number.isNaN(d.getTime())) return input
    return d.toLocaleString()
  } catch {
    return input
  }
}

async function getUiConfig(): Promise<UiConfig | null> {
  try {
    const headerList = headers()
    const host = headerList.get('host') ?? 'localhost:3000'
    const proto = headerList.get('x-forwarded-proto') ?? 'http'
    const cookie = headerList.get('cookie') ?? ''

    const res = await fetch(`${proto}://${host}/api/me/ui-config`, {
      cache: 'no-store',
      headers: { cookie },
    })
    if (!res.ok) return null
    return (await res.json()) as UiConfig
  } catch {
    return null
  }
}

function mapAccess(lockState?: UiTool['lockState'], reason?: string) {
  if (!lockState) return undefined
  if (lockState === 'available' || lockState === 'trial') return 'unlocked'
  if (lockState === 'limited') return 'locked_time'
  if (lockState === 'locked' || lockState === 'disabled') {
    const reasonText = (reason ?? '').toLowerCase()
    if (reasonText.includes('token')) return 'locked_tokens'
    return 'locked_plan'
  }
  return undefined
}

export default async function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug)
  if (!tool) return notFound()

  const ui = await getUiConfig()
  const uiTool = ui?.catalogTools?.find((t) => t.id === tool.id)

  const access = mapAccess(uiTool?.lockState, uiTool?.reason) ?? (tool.isFree ? 'unlocked' : undefined)
  const resetAtText = access === 'locked_time' ? formatResetAt(ui?.usage?.resetsAtISO) : null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <ToolHeader
          name={tool.name}
          description={tool.description}
          category={tool.category}
          tokensCost={tool.tokensCost}
          isFree={tool.isFree}
          access={access}
          resetAtText={resetAtText}
        />

        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <ToolCTA slug={tool.slug} access={access} resetAtText={resetAtText} tokensCost={tool.tokensCost} />
          </CardContent>
        </Card>

        <ToolPreview inputs={tool.inputs} outputs={tool.outputs} />

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">Who this is for</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>People posting consistently but not growing.</li>
                <li>Marketers testing hooks, CTAs, and retention daily.</li>
                <li>Anyone tired of guessing and ready to measure.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
