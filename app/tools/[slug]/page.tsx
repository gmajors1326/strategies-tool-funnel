import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getToolBySlug } from '@/src/lib/tools/getToolBySlug'
import { ToolHeader } from '@/src/components/tools/ToolHeader'
import { ToolPreview } from '@/src/components/tools/ToolPreview'
import { ToolRunner } from '@/src/components/tools/ToolRunner'
import { Card, CardContent } from '@/components/ui/card'

type UiConfig = {
  tokens?: { balance?: number }
  locks?: Record<
    string,
    | { status: 'unlocked' }
    | { status: 'locked_tokens' }
    | { status: 'locked_plan' }
    | { status: 'locked_time'; resetAt?: string }
  >
  entitlements?: {
    canExport?: boolean
    canSeeHistory?: boolean
    canSaveToVault?: boolean
    canExportTemplates?: boolean
  }
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
    const res = await fetch(`${proto}://${host}/api/me/ui-config`, {
      cache: 'no-store',
      headers: { cookie: headerList.get('cookie') ?? '' },
    })
    if (!res.ok) return null
    return (await res.json()) as UiConfig
  } catch {
    return null
  }
}

export default async function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug)
  if (!tool) return notFound()

  const ui = await getUiConfig()
  const lock = ui?.locks?.[tool.id] ?? ui?.locks?.[tool.slug]

  const access = lock?.status ?? (tool.isFree ? 'unlocked' : undefined)

  const resetAtText = access === 'locked_time' ? formatResetAt((lock as any)?.resetAt) : null

  const copy = tool.microcopy ?? {}
  const oneLiner = copy.oneLiner ?? tool.description
  const whoFor =
    copy.whoFor ?? [
      'People posting consistently but not growing.',
      'Marketers testing hooks, CTAs, and retention daily.',
      'Anyone tired of guessing and ready to measure.',
    ]
  const youInput = copy.youInput ?? []
  const youGet = copy.youGet ?? []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-6">
        <ToolHeader
          name={tool.name}
          description={oneLiner}
          category={tool.category}
          tokensCost={tool.tokensCost}
          isFree={tool.isFree}
          access={access as any}
          resetAtText={resetAtText}
        />

        <ToolRunner
          toolId={tool.id}
          toolSlug={tool.slug}
          toolName={tool.name}
          fields={tool.inputs ?? []}
          access={access as any}
          tokensCost={tool.tokensCost}
          ui={ui}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 p-6">
              <p className="text-sm font-medium">Who this is for</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {whoFor.slice(0, 4).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              {youInput.length ? (
                <>
                  <p className="text-sm font-medium">You input</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {youInput.slice(0, 4).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {youGet.length ? (
                <>
                  <p className="mt-3 text-sm font-medium">You get</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {youGet.slice(0, 4).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <ToolPreview inputs={tool.inputs} outputs={tool.outputs} />
      </div>
    </div>
  )
}
