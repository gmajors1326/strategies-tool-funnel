import { InputField } from './ai/toolRegistry'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateInput(field: InputField, value: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required field check
  if (field.required) {
    if (value === '' || value === null || value === undefined) {
      errors.push(`${field.label} is required`)
      return { isValid: false, errors, warnings }
    }
  }

  // Skip validation if value is empty and not required
  if (!value || value === '') {
    return { isValid: true, errors, warnings }
  }

  // String length validation
  if (field.type === 'text' || field.type === 'textarea') {
    const strValue = String(value)
    
    if (field.maxLength && strValue.length > field.maxLength) {
      errors.push(`${field.label} must be ${field.maxLength} characters or less`)
    }
    
    if (field.minLength && strValue.length < field.minLength) {
      errors.push(`${field.label} must be at least ${field.minLength} characters`)
    }
  }

  // Number validation
  if (field.type === 'number') {
    const numValue = Number(value)
    if (isNaN(numValue)) {
      errors.push(`${field.label} must be a valid number`)
    }
  }

  // Hook-specific validation (for hook fields)
  if (field.key.includes('hook') && field.type === 'textarea') {
    const strValue = String(value)
    const wordCount = strValue.trim().split(/\s+/).length
    if (wordCount > 12) {
      warnings.push(`Hook should be ≤12 words (currently ${wordCount})`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateAllInputs(fields: InputField[], inputs: Record<string, any>): ValidationResult {
  const allErrors: string[] = []
  const allWarnings: string[] = []

  for (const field of fields) {
    const result = validateInput(field, inputs[field.key])
    allErrors.push(...result.errors)
    allWarnings.push(...result.warnings)
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}
