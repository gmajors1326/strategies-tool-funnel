export interface RecentRun {
  id: string
  toolId: string
  timestamp: number
  inputs: Record<string, any>
  outputs: Record<string, any>
  title?: string
}

const STORAGE_KEY = 'strategy_tools_recent_runs'
const MAX_RUNS_PER_TOOL = 10
const MAX_TOTAL_RUNS = 100

export function saveRecentRun(run: Omit<RecentRun, 'id' | 'timestamp'>): void {
  try {
    const existing = getRecentRuns()
    
    // Remove old runs for this tool if we're at the limit
    const toolRuns = existing.filter(r => r.toolId === run.toolId)
    const otherRuns = existing.filter(r => r.toolId !== run.toolId)
    
    let updatedToolRuns = [...toolRuns, {
      ...run,
      id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }]
    
    // Keep only the most recent MAX_RUNS_PER_TOOL runs per tool
    updatedToolRuns = updatedToolRuns
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_RUNS_PER_TOOL)
    
    // Combine and limit total runs
    let allRuns = [...otherRuns, ...updatedToolRuns]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_TOTAL_RUNS)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allRuns))
  } catch (err) {
    console.error('Failed to save recent run:', err)
  }
}

export function getRecentRuns(): RecentRun[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as RecentRun[]
  } catch (err) {
    console.error('Failed to get recent runs:', err)
    return []
  }
}

export function getRecentRunsByTool(toolId: string): RecentRun[] {
  return getRecentRuns()
    .filter(run => run.toolId === toolId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_RUNS_PER_TOOL)
}

export function clearRecentRuns(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear recent runs:', err)
  }
}

export function removeRecentRun(id: string): void {
  try {
    const existing = getRecentRuns()
    const updated = existing.filter(run => run.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to remove recent run:', err)
  }
}
