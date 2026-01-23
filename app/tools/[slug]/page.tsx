import { redirect } from 'next/navigation'
import { requireUser } from '@/src/lib/auth/requireUser'
import { TOOL_REGISTRY, type ToolMeta } from '@/src/lib/tools/registry'
import { ToolRunner } from '@/src/components/tools/ToolRunner'
import { isLaunchTool } from '@/src/lib/tools/launchTools'

export const dynamic = 'force-dynamic'

type RunnerField = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'url'
  placeholder?: string
  help?: string
  required?: boolean
  options?: string[]
}

const mapFieldType = (type: string): RunnerField['type'] => {
  switch (type) {
    case 'shortText':
      return 'text'
    case 'longText':
      return 'textarea'
    case 'number':
      return 'number'
    case 'select':
    case 'multiSelect':
    case 'toggle':
      return 'select'
    default:
      return 'text'
  }
}

const mapFields = (fields: ToolMeta['fields']): RunnerField[] => {
  return (fields ?? []).map((field) => ({
    key: field.key,
    label: field.label,
    type: mapFieldType(field.type),
    placeholder: field.placeholder,
    help: field.help,
    required: field.required,
    options: (field.options ?? []).map((opt) => opt.label ?? opt.value ?? String(opt)),
  }))
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  try {
    await requireUser()
  } catch (error) {
    const message = String((error as Error)?.message || '').toLowerCase()
    if (
      message.includes('unauthorized') ||
      message.includes('session missing') ||
      message.includes('session invalid') ||
      message.includes('sign in via /verify')
    ) {
      redirect('/verify')
    }
    throw error
  }

  const { slug } = await params
  const tool = (TOOL_REGISTRY as Record<string, ToolMeta>)[slug]

  if (!tool || !isLaunchTool(tool.id)) {
    return (
      <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-6">
        <h1 className="text-lg font-semibold">Tool not available yet</h1>
        <p className="text-sm text-[hsl(var(--muted))]">
          This tool isn&apos;t part of the current launch set.
        </p>
        <a href="/app/explore" className="text-sm font-semibold underline">
          Back to Explore
        </a>
      </div>
    )
  }

  const fields = mapFields(tool.fields)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{tool.name}</h1>
        {tool.description ? (
          <p className="text-sm text-[hsl(var(--muted))]">{tool.description}</p>
        ) : null}
      </div>

      <ToolRunner
        toolId={tool.id}
        toolSlug={tool.id}
        toolName={tool.name}
        toolMeta={tool}
        fields={fields}
        tokensCost={tool.tokensPerRun}
      />
    </div>
  )
}
