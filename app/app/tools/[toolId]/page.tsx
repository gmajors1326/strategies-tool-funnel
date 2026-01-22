import { notFound } from 'next/navigation'
import { getToolMeta } from '@/src/lib/tools/registry'
import ToolRunner from '@/src/components/tools/ToolRunner'

export const dynamic = 'force-dynamic'

export default function ToolPage({ params }: { params: { toolId: string } }) {
  const toolId = params.toolId

  let tool
  try {
    tool = getToolMeta(toolId)
  } catch {
    return notFound()
  }

  // Hide non-public tools (optional safety)
  if (!tool.enabled || !tool.isPublic) {
    return notFound()
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-100">{tool.name}</h1>
            <p className="mt-1 text-sm text-neutral-400">{tool.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="rounded-md bg-neutral-900 px-2 py-1">toolId: {tool.id}</span>
              <span className="rounded-md bg-neutral-900 px-2 py-1">difficulty: {tool.difficulty}</span>
              <span className="rounded-md bg-neutral-900 px-2 py-1">ai: {tool.aiLevel}</span>
              <span className="rounded-md bg-neutral-900 px-2 py-1">{tool.tokensPerRun} tokens/run</span>
            </div>

            {tool.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {tool.tags.slice(0, 10).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 md:justify-end">
            <a
              href="/app/explore"
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            >
              ← Back to Explore
            </a>
            <a
              href="/pricing"
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
            >
              Upgrade / Tokens
            </a>
          </div>
        </div>
      </div>

      {/* Runner */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ToolRunner toolId={tool.id} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="text-sm font-semibold text-neutral-200">Quick notes</div>

            <div className="mt-3 space-y-2 text-sm text-neutral-400">
              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <div className="text-xs font-semibold text-neutral-300">Plan access</div>
                <div className="mt-1 text-xs text-neutral-400">
                  Free: <span className="text-neutral-200">{tool.planEntitlements?.free ? '✅' : '🔒'}</span> • Pro:{' '}
                  <span className="text-neutral-200">{tool.planEntitlements?.pro_monthly ? '✅' : '🔒'}</span> • Team:{' '}
                  <span className="text-neutral-200">{tool.planEntitlements?.team ? '✅' : '🔒'}</span> • Lifetime:{' '}
                  <span className="text-neutral-200">{tool.planEntitlements?.lifetime ? '✅' : '🔒'}</span>
                </div>
              </div>

              {tool.examples?.length ? (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <div className="text-xs font-semibold text-neutral-300">Examples</div>
                  <div className="mt-1 text-xs text-neutral-400">
                    This tool has <span className="text-neutral-200">{tool.examples.length}</span> example input(s). Use
                    “Load example…” inside the runner.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                  <div className="text-xs font-semibold text-neutral-300">Examples</div>
                  <div className="mt-1 text-xs text-neutral-400">No examples added yet for this tool.</div>
                </div>
              )}

              <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
                <div className="text-xs font-semibold text-neutral-300">Pro tip</div>
                <div className="mt-1 text-xs text-neutral-400">
                  If something’s locked, the runner’s preflight will tell you why before you waste a run.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="text-sm font-semibold text-neutral-200">Support</div>
            <div className="mt-2 text-sm text-neutral-400">
              If a tool output looks wrong, grab the <span className="text-neutral-200">request id</span> shown in the
              UI and send it to support.
            </div>
            <a
              href="/app/support"
              className="mt-3 inline-flex rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
            >
              Open support →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
