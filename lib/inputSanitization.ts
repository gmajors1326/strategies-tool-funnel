export function sanitizeInput(value: any): any {
  if (typeof value === 'string') {
    // Remove potentially dangerous characters but keep normal text
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeInput)
  }
  
  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeInput(val)
    }
    return sanitized
  }
  
  return value
}

export function sanitizeInputs(inputs: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(inputs)) {
    sanitized[key] = sanitizeInput(value)
  }
  return sanitized
}
