export interface PersistedResult {
  toolId: string
  timestamp: number
  inputs: Record<string, any>
  outputs: Record<string, any>
}

const STORAGE_KEY_PREFIX = 'strategy_tools_result_'

export function persistResult(toolId: string, inputs: Record<string, any>, outputs: Record<string, any>): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${toolId}`
    const data: PersistedResult = {
      toolId,
      timestamp: Date.now(),
      inputs,
      outputs,
    }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error('Failed to persist result:', err)
  }
}

export function getPersistedResult(toolId: string): PersistedResult | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${toolId}`
    const stored = localStorage.getItem(key)
    if (!stored) return null
    return JSON.parse(stored) as PersistedResult
  } catch (err) {
    console.error('Failed to get persisted result:', err)
    return null
  }
}

export function clearPersistedResult(toolId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${toolId}`
    localStorage.removeItem(key)
  } catch (err) {
    console.error('Failed to clear persisted result:', err)
  }
}

export function clearAllPersistedResults(): void {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (err) {
    console.error('Failed to clear all persisted results:', err)
  }
}
