export interface ToolUsage {
  toolId: string
  count: number
  lastUsed: number
}

const STORAGE_KEY = 'strategy_tools_usage_analytics'
const MAX_ENTRIES = 1000

export function trackToolUsage(toolId: string): void {
  try {
    const usage = getToolUsage()
    const existing = usage.find(u => u.toolId === toolId)
    
    if (existing) {
      existing.count++
      existing.lastUsed = Date.now()
    } else {
      usage.push({
        toolId,
        count: 1,
        lastUsed: Date.now(),
      })
    }
    
    // Sort by count descending, keep only top entries
    usage.sort((a, b) => b.count - a.count)
    const limited = usage.slice(0, MAX_ENTRIES)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
  } catch (err) {
    console.error('Failed to track tool usage:', err)
  }
}

export function getToolUsage(): ToolUsage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as ToolUsage[]
  } catch (err) {
    console.error('Failed to get tool usage:', err)
    return []
  }
}

export function getMostUsedTools(limit: number = 10): ToolUsage[] {
  return getToolUsage()
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function clearUsageAnalytics(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear usage analytics:', err)
  }
}
