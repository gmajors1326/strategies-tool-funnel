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
  options?: Array<{ label: string; value: string }>
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
    options: (field.options ?? []).map((opt) => {
      if (typeof opt === 'string') return { label: opt, value: opt }
      const label = opt.label ?? opt.value ?? String(opt)
      const value = opt.value ?? opt.label ?? String(opt)
      return { label, value }
    }),
  }))
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tool = (TOOL_REGISTRY as Record<string, ToolMeta>)[slug]

  if (!tool || !isLaunchTool(tool.id)) {
    return (
      <div className="min-h-screen bg-[#7d9b76] text-[hsl(var(--text))]">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-white/10 bg-[#3a3a3a] p-6 shadow-[0_24px_40px_rgba(0,0,0,0.35)]">
            <h1 className="text-lg font-semibold">Tool not available yet</h1>
            <p className="text-sm text-[hsl(var(--muted))]">
              This tool isn&apos;t part of the current launch set.
            </p>
            <a href="/app/explore" className="text-sm font-semibold underline">
              Back to Explore
            </a>
          </div>
        </div>
      </div>
    )
  }

  const fields = mapFields(tool.fields)

  return (
    <div className="min-h-screen bg-[#7d9b76] text-[hsl(var(--text))]">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6">
        <ToolRunner
          toolId={tool.id}
          toolSlug={tool.id}
          toolName={tool.name}
          toolMeta={tool}
          fields={fields}
          tokensCost={tool.tokensPerRun}
        />
      </div>
    </div>
  )
}
