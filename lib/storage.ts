export interface PlanItem {
  id: string
  toolId: string
  timestamp: number
  title: string
  inputs: Record<string, any>
  outputs: Record<string, any>
}

const STORAGE_KEY = 'strategy_tools_plan'

export function saveToPlan(item: Omit<PlanItem, 'id' | 'timestamp'>): void {
  try {
    const existing = getPlanItems()
    const newItem: PlanItem = {
      ...item,
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }
    const updated = [...existing, newItem]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save to plan:', err)
  }
}

export function getPlanItems(): PlanItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as PlanItem[]
  } catch (err) {
    console.error('Failed to get plan items:', err)
    return []
  }
}

export function removePlanItem(id: string): void {
  try {
    const existing = getPlanItems()
    const updated = existing.filter(item => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to remove plan item:', err)
  }
}

export function clearPlan(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear plan:', err)
  }
}

export function getPlanItemsByTool(toolId: string): PlanItem[] {
  return getPlanItems().filter(item => item.toolId === toolId)
}
