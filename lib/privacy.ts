const SENSITIVE_KEY_PATTERN = /(message|notes?|bio|caption|text|snippet|dm|email|phone|handle|username|url|link)/i
const MAX_STRING_LENGTH = 200

export function minimizeInputsForStorage(input: Record<string, any>): Record<string, any> {
  return minimizeValue(input) as Record<string, any>
}

function minimizeValue(value: any, key?: string): any {
  if (value === null || value === undefined) return value

  if (typeof value === 'string') {
    if (key && SENSITIVE_KEY_PATTERN.test(key)) {
      return '[redacted]'
    }
    if (value.length > MAX_STRING_LENGTH) {
      return `[redacted:${value.length}chars]`
    }
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => minimizeValue(item))
  }

  if (typeof value === 'object') {
    const next: Record<string, any> = {}
    Object.entries(value).forEach(([childKey, childValue]) => {
      next[childKey] = minimizeValue(childValue, childKey)
    })
    return next
  }

  return value
}
