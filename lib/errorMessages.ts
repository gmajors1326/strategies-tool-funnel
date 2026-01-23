export function formatErrorMessage(error: string): string {
  // AI quota/billing errors
  if (error.includes('quota') || error.includes('429')) {
    return 'AI quota exceeded. Please try again in a few minutes or check your OpenAI billing settings.'
  }
  
  // API key errors
  if (error.includes('401') || error.includes('Invalid') && error.includes('API')) {
    return 'Invalid API key. Please check your OPENAI_API_KEY environment variable.'
  }
  
  // Payment errors
  if (error.includes('402') || error.includes('payment') || error.includes('billing')) {
    return 'Payment required. Please add a payment method at https://platform.openai.com/account/billing'
  }
  
  // JSON parsing errors
  if (error.includes('JSON') || error.includes('parse') || error.includes('Invalid')) {
    return 'Invalid response format. Please check your inputs and try again.'
  }
  
  // Network errors
  if (error.includes('fetch') || error.includes('network') || error.includes('Failed to fetch')) {
    return 'Network error. Please check your connection and try again.'
  }
  
  // Timeout errors
  if (error.includes('timeout') || error.includes('Timeout')) {
    return 'Request timed out. Please try again.'
  }
  
  // Rate limiting
  if (error.includes('rate limit') || error.includes('Rate limit')) {
    return 'Rate limit exceeded. Please wait a moment and try again.'
  }
  
  // Return original error if no match
  return error
}

export function extractValidationErrors(error: string): string[] {
  const errors: string[] = []
  
  // Try to extract field names from common error patterns
  const fieldMatch = error.match(/field[:\s]+['"]?(\w+)['"]?/i)
  if (fieldMatch) {
    errors.push(`Field "${fieldMatch[1]}" has an error`)
  }
  
  // Check for missing required fields
  const missingMatch = error.match(/missing[:\s]+['"]?(\w+)['"]?/i)
  if (missingMatch) {
    errors.push(`Required field "${missingMatch[1]}" is missing`)
  }
  
  return errors.length > 0 ? errors : [error]
}
