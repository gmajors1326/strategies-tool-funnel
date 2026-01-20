import type { RunError } from '@/src/lib/tools/runTypes'

type ValidationResult = {
  valid: boolean
  errors?: RunError
}

const minLen = (value?: string, length = 3) =>
  typeof value === 'string' && value.trim().length >= length

export const validateInput = (toolId: string, input: Record<string, any>): ValidationResult => {
  const errors: Record<string, string> = {}

  if (toolId === 'hook-analyzer') {
    if (!minLen(input.hook, 6) && !minLen(input.topic, 4)) {
      errors.hook = 'Provide a hook or topic.'
    }
  }

  if (toolId === 'cta-match-analyzer') {
    if (!minLen(input.offer, 4)) {
      errors.offer = 'Offer is required.'
    }
    if (!minLen(input.cta, 4)) {
      errors.cta = 'CTA is required.'
    }
  }

  if (toolId === 'ig-post-intelligence') {
    if (!minLen(input.caption, 8) && !minLen(input.postText, 8)) {
      errors.caption = 'Provide a caption or post text.'
    }
  }

  if (toolId === 'yt-video-intelligence') {
    if (!minLen(input.title, 4) && !minLen(input.transcriptSnippet, 12)) {
      errors.title = 'Provide a title or transcript snippet.'
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
