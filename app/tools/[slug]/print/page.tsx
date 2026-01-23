import { notFound } from 'next/navigation'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { TOOL_REGISTRY, type ToolMeta } from '@/src/lib/tools/registry'
import { PrintClient } from './PrintClient'

export const dynamic = 'force-dynamic'

export default async function ToolPrintPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { runId?: string }
}) {
  const user = await getUserOrThrow()
  const runId = searchParams.runId
  if (!runId) return notFound()

  const run = await prisma.toolRun.findFirst({
    where: { id: runId, userId: user.id },
    select: { toolSlug: true, input: true, inputsJson: true, output: true, outputsJson: true, createdAt: true },
  })

  if (!run) return notFound()
  if (run.toolSlug && run.toolSlug !== params.slug) return notFound()

  const tool = (TOOL_REGISTRY as Record<string, ToolMeta>)[params.slug]
  const input = run.input ?? run.inputsJson ?? {}
  const output = run.output ?? run.outputsJson ?? {}

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8 text-black">
      <PrintClient />
      <div>
        <h1 className="text-2xl font-semibold">{tool?.name || params.slug}</h1>
        <p className="text-sm text-gray-600">Run ID: {runId}</p>
        <p className="text-sm text-gray-600">Created: {run.createdAt.toISOString()}</p>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Inputs</h2>
        <pre className="mt-2 whitespace-pre-wrap rounded-md border border-gray-200 p-3 text-xs">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="text-lg font-semibold">Outputs</h2>
        <pre className="mt-2 whitespace-pre-wrap rounded-md border border-gray-200 p-3 text-xs">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    </div>
  )
}
