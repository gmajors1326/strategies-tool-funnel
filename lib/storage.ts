export interface SavedPlan {
  id: string
  goal: string
  postType: string
  timestamp: number
  data: {
    hooks: string[]
    captions: string[]
    ctas: string[]
    rules: string[]
  }
}

const STORAGE_KEY = 'post_types_plan'

export function saveToPlan(plan: Omit<SavedPlan, 'id' | 'timestamp'>): void {
  try {
    const existing = getSavedPlans()
    const newPlan: SavedPlan = {
      ...plan,
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    const updated = [...existing, newPlan]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save plan:', err)
  }
}

export function getSavedPlans(): SavedPlan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as SavedPlan[]
  } catch (err) {
    console.error('Failed to get saved plans:', err)
    return []
  }
}

export function removePlan(id: string): void {
  try {
    const existing = getSavedPlans()
    const updated = existing.filter(plan => plan.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to remove plan:', err)
  }
}

export function clearAllPlans(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear plans:', err)
  }
}
