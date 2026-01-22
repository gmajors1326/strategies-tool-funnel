import { listTools, type ToolFieldType } from '@/src/lib/tools/registry'

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
}

type ToolInputType = NonNullable<ToolRecord['inputs']>[number]['type']

const mapFieldType = (type: ToolFieldType): ToolInputType => {
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

export function getAllTools(): ToolRecord[] {
  return listTools({ includeHidden: false })
    .map((t) => ({
      id: t.id,
      slug: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      tokensCost: t.tokensPerRun,
      isFree: t.tokensPerRun === 0,
      inputs: (t.fields ?? []).map((f) => ({
        key: f.key,
        label: f.label,
        type: mapFieldType(f.type),
        placeholder: f.placeholder,
        help: f.help,
        required: f.required,
        options: f.options?.map((opt) => opt.label ?? opt.value),
      })),
      outputs: (t.outputHints ?? []).map((hint, idx) => ({
        key: `output-${idx}`,
        label: hint,
        type: 'text',
      })),
    }))
    .filter((t) => Boolean(t.slug))
}

export function getToolBySlug(slug: string): ToolRecord | null {
  const tools = getAllTools()
  return tools.find((t) => t.slug === slug) ?? null
}
