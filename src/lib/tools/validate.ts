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

const validateType = (field: ToolField, value: any) => {
  if (value === null || value === undefined || value === '') return null

  if (field.type === 'number') {
    const n = Number(value)
    return Number.isFinite(n) ? null : `${field.label} must be a number.`
  }

  if (field.type === 'toggle') {
    return typeof value === 'boolean' ? null : `${field.label} must be true or false.`
  }

  if (field.type === 'multiSelect') {
    if (!Array.isArray(value)) return `${field.label} must be a list.`
    const allowed = new Set((field.options ?? []).map((opt) => opt.value))
    const invalid = value.filter((item: string) => !allowed.has(item))
    return invalid.length ? `${field.label} has invalid selections.` : null
  }

  if (field.type === 'select') {
    const allowed = new Set((field.options ?? []).map((opt) => opt.value))
    return allowed.has(value) ? null : `${field.label} must be a valid option.`
  }

  return typeof value === 'string' ? null : `${field.label} must be text.`
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

  if (tool.inputSchema) {
    const parsed = tool.inputSchema.safeParse(input)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] ? String(issue.path[0]) : 'input'
        if (!errors[key]) {
          errors[key] = issue.message || 'Invalid value.'
        }
      }
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

  for (const field of tool.fields) {
    if (!field.required) continue
    if (isEmpty(field, input[field.key])) {
      errors[field.key] = `${field.label} is required.`
    }
  }

  for (const field of tool.fields) {
    const issue = validateType(field, input[field.key])
    if (issue) {
      errors[field.key] = issue
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
