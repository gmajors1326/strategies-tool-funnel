import { toolRegistry } from '@/src/lib/tools/toolRegistry'

export type ToolRecord = {
  id: string
  slug: string
  name: string
  description: string
  category?: string
  tokensCost?: number
  isFree?: boolean
  inputs?: Array<{
    key: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'number' | 'url'
    placeholder?: string
    help?: string
    required?: boolean
    options?: string[]
  }>
  outputs?: Array<{
    key: string
    label: string
    type: 'text' | 'list' | 'score' | 'json'
  }>
  microcopy?: {
    oneLiner?: string
    whoFor?: string[]
    youInput?: string[]
    youGet?: string[]
    notes?: string[]
  }
}

export function getAllTools(): ToolRecord[] {
  const raw: any = toolRegistry as any
  const tools: any[] = Array.isArray(raw) ? raw : Object.values(raw || {})

  const mapFieldType = (type: string): ToolRecord['inputs'][number]['type'] => {
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

  return tools
    .map((t) => {
      const id = t.id ?? t.toolId ?? t.key ?? t.slug
      const slug = t.slug ?? t.id ?? t.toolId ?? t.key

      return {
        id,
        slug,
        name: t.name ?? t.title ?? 'Untitled Tool',
        description: t.description ?? t.shortDescription ?? '',
        category: t.category,
        tokensCost: t.tokensCost ?? t.costTokens ?? t.tokenCost ?? t.tokensPerRun ?? 0,
        isFree: Boolean(t.isFree ?? (t.tokensCost ?? t.tokensPerRun ?? 0) === 0),
        inputs: (t.inputs ?? t.schema?.inputs ?? t.fields ?? []).map((f: any) => ({
          key: f.key,
          label: f.label,
          type: mapFieldType(f.type),
          placeholder: f.placeholder,
          help: f.help,
          required: f.required,
          options: (f.options ?? []).map((opt: any) => opt.label ?? opt.value ?? String(opt)),
        })),
        outputs:
          t.outputs ??
          t.schema?.outputs ??
          (t.outputHints ?? []).map((hint: string, idx: number) => ({
            key: `output-${idx}`,
            label: hint,
            type: 'text' as const,
          })) ??
          [],
        microcopy: t.microcopy ?? t.uiCopy ?? null,
      } as ToolRecord
    })
    .filter((t) => Boolean(t.slug))
}

export function getToolBySlug(slug: string): ToolRecord | null {
  const tools = getAllTools()
  return tools.find((t) => t.slug === slug) ?? null
}
