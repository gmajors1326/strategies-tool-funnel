import type { RunError } from '@/src/lib/tools/runTypes'
import { getToolMeta, type ToolField } from '@/src/lib/tools/registry'

type ValidationResult = {
  valid: boolean
  errors?: RunError
}

const isEmpty = (field: ToolField, value: any) => {
  if (field.type === 'number') {
    if (value === '' || value === null || value === undefined) return true
    const n = Number(value)
    return !Number.isFinite(n)
  }
  if (field.type === 'toggle') {
    return value === null || value === undefined
  }
  if (field.type === 'multiSelect') {
    return !Array.isArray(value) || value.length === 0
  }
  return typeof value !== 'string' || value.trim().length === 0
}

export const validateInput = (toolId: string, input: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {}
  let tool

  try {
    tool = getToolMeta(toolId)
  } catch {
    return {
      valid: false,
      errors: {
        code: 'VALIDATION_ERROR',
        message: `Unknown toolId: ${toolId}`,
        details: { toolId: 'Unknown toolId.' },
      },
    }
  }

  for (const field of tool.fields) {
    if (!field.required) continue
    if (isEmpty(field, input[field.key])) {
      errors[field.key] = `${field.label} is required.`
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      valid: false,
      errors: {
        code: 'VALIDATION_ERROR',
        message: 'Please fix the highlighted fields.',
        details: errors,
      },
    }
  }

  return { valid: true }
}
