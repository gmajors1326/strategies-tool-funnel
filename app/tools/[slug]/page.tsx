import { notFound } from 'next/navigation'
import { requireUser } from '@/src/lib/auth/requireUser'
import { TOOL_REGISTRY, type ToolMeta } from '@/src/lib/tools/registry'
import { ToolRunner } from '@/src/components/tools/ToolRunner'

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
  await requireUser()

  const { slug } = await params
  const tool = (TOOL_REGISTRY as Record<string, ToolMeta>)[slug]

  if (!tool) return notFound()

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
        fields={fields}
        tokensCost={tool.tokensPerRun}
      />
    </div>
  )
}
