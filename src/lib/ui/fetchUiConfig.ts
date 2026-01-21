// src/lib/ui/fetchUiConfig.ts
import type { UiConfig } from '@/src/lib/ui/types'
import { buildUiConfig } from '@/src/lib/ui/resolveUiConfig'

/**
 * fetchUiConfig()
 * Server-only helper used by server components.
 * Uses the canonical UI config builder (real session + DB-backed usage).
 */
export async function fetchUiConfig(): Promise<UiConfig> {
  return buildUiConfig()
}
