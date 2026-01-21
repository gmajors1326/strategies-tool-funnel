// src/lib/ai/openaiClient.ts
import OpenAI from 'openai'

let _client: OpenAI | null = null

export function getOpenAIClient() {
  if (_client) return _client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in environment.')
  }
  _client = new OpenAI({ apiKey })
  return _client
}

export function pickModel(aiLevel: 'light' | 'heavy' | 'none') {
  if (aiLevel === 'heavy') return process.env.OPENAI_MODEL_HEAVY || 'gpt-5.2'
  if (aiLevel === 'light') return process.env.OPENAI_MODEL_LIGHT || 'gpt-5.2'
  return process.env.OPENAI_MODEL_LIGHT || 'gpt-5.2'
}

export function safetyIdentifierFromUserId(userId: string) {
  // Avoid sending raw emails/usernames. This is a stable-ish identifier.
  // If you want, hash userId here later.
  return `user:${userId}`
}
