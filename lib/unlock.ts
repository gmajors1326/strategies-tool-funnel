'use client'

import { unlockSteps, UnlockCondition, unlockRules } from '@/config/toolCategories'

const STORAGE_KEY_UNLOCKS = 'strategy_tools_unlocked'
const STORAGE_KEY_USAGE = 'strategy_tools_usage'

interface ToolUsage {
  toolId: string
  count: number
  lastUsed: number
}

export function getUnlockedTools(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_UNLOCKS)
    if (!stored) {
      // First login - unlock the first tool
      const firstTool = unlockSteps.find(s => s.unlock_condition.type === 'first_login')
      if (firstTool) {
        const unlocked = new Set([firstTool.toolId])
        localStorage.setItem(STORAGE_KEY_UNLOCKS, JSON.stringify(Array.from(unlocked)))
        return unlocked
      }
      return new Set()
    }
    const unlockedArray = JSON.parse(stored) as string[]
    return new Set(unlockedArray)
  } catch {
    return new Set()
  }
}

export function getToolUsage(): Map<string, number> {
  if (typeof window === 'undefined') return new Map()
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USAGE)
    if (!stored) return new Map()
    
    const usage = JSON.parse(stored) as ToolUsage[]
    const map = new Map<string, number>()
    usage.forEach(u => map.set(u.toolId, u.count))
    return map
  } catch {
    return new Map()
  }
}

export function recordToolUse(toolId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USAGE)
    const usage: ToolUsage[] = stored ? JSON.parse(stored) : []
    
    const existing = usage.find(u => u.toolId === toolId)
    if (existing) {
      existing.count++
      existing.lastUsed = Date.now()
    } else {
      usage.push({ toolId, count: 1, lastUsed: Date.now() })
    }
    
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(usage))
    
    // Check if this unlocks any new tools
    checkAndUnlockTools(usage)
  } catch (err) {
    console.error('Failed to record tool use:', err)
  }
}

function checkAndUnlockTools(usage: ToolUsage[]): void {
  const usageMap = new Map<string, number>()
  usage.forEach(u => usageMap.set(u.toolId, u.count))
  
  const unlocked = getUnlockedTools()
  let changed = false
  
  for (const step of unlockSteps) {
    // Skip if already unlocked
    if (unlocked.has(step.toolId)) continue
    
    const condition = step.unlock_condition
    
    if (condition.type === 'first_login') {
      unlocked.add(step.toolId)
      changed = true
    } else if (condition.type === 'tool_used') {
      const toolRef = unlockSteps.find(s => s.tool_id === condition.tool_id)
      if (toolRef && (usageMap.get(toolRef.toolId) || 0) >= condition.times) {
        unlocked.add(step.toolId)
        changed = true
      }
    } else if (condition.type === 'tools_used_any') {
      const allMet = condition.tool_ids.every(toolId => {
        const toolRef = unlockSteps.find(s => s.tool_id === toolId)
        return toolRef && (usageMap.get(toolRef.toolId) || 0) >= condition.times_each
      })
      if (allMet) {
        unlocked.add(step.toolId)
        changed = true
      }
    }
  }
  
  if (changed) {
    localStorage.setItem(STORAGE_KEY_UNLOCKS, JSON.stringify(Array.from(unlocked)))
  }
}

export function isToolUnlocked(toolId: string): boolean {
  if (!unlockRules.default_locked) return true
  return getUnlockedTools().has(toolId)
}

export function getNextUnlockHint(toolId: string): string | null {
  const step = unlockSteps.find(s => s.toolId === toolId)
  if (!step) return null
  
  const condition = step.unlock_condition
  
  if (condition.type === 'first_login') {
    return 'Available on first login'
  } else if (condition.type === 'tool_used') {
    const toolRef = unlockSteps.find(s => s.tool_id === condition.tool_id)
    const toolName = toolRef?.name || `Tool ${condition.tool_id}`
    const times = condition.times === 1 ? 'once' : `${condition.times} times`
    return `Unlock by using "${toolName}" ${times}`
  } else if (condition.type === 'tools_used_any') {
    const toolNames = condition.tool_ids
      .map(id => unlockSteps.find(s => s.tool_id === id)?.name)
      .filter(Boolean)
      .join(', ')
    return `Unlock by using ${toolNames} ${condition.times_each} times each`
  }
  
  return null
}

export function unlockAllTools(): void {
  if (typeof window === 'undefined') return
  const allToolIds = unlockSteps.map(s => s.toolId)
  localStorage.setItem(STORAGE_KEY_UNLOCKS, JSON.stringify(allToolIds))
}
