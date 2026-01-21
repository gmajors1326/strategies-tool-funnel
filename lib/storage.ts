export interface PlanItem {
  id: string
  toolId: string
  timestamp: number
  title: string
  inputs: Record<string, any>
  outputs: Record<string, any>
}

const STORAGE_KEY = 'strategy_tools_plan'
const API_BASE = '/api/plan-items'

function readLocalPlanItems(): PlanItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as PlanItem[]
  } catch (err) {
    console.error('Failed to read local plan items:', err)
    return []
  }
}

function writeLocalPlanItems(items: PlanItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Failed to write local plan items:', err)
  }
}

function createLocalItem(item: Omit<PlanItem, 'id' | 'timestamp'>): PlanItem {
  return {
    ...item,
    id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
  }
}

async function tryFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, init)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function saveToPlan(item: Omit<PlanItem, 'id' | 'timestamp'>): Promise<PlanItem | null> {
  if (typeof window === 'undefined') return null
  const payload = {
    toolId: item.toolId,
    title: item.title,
    inputs: item.inputs,
    outputs: item.outputs,
    clientTempId: `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }

  const response = await tryFetch<{ item: PlanItem }>(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (response?.item) {
    const existing = readLocalPlanItems()
    writeLocalPlanItems([response.item, ...existing.filter((i) => i.id !== response.item.id)])
    return response.item
  }

  const existing = readLocalPlanItems()
  const localItem = createLocalItem(item)
  writeLocalPlanItems([localItem, ...existing])
  return localItem
}

export async function getPlanItems(): Promise<PlanItem[]> {
  if (typeof window === 'undefined') return []

  const response = await tryFetch<{ items: PlanItem[] }>(API_BASE, { method: 'GET' })
  if (response?.items) {
    writeLocalPlanItems(response.items)
    return response.items
  }

  return readLocalPlanItems()
}

export async function removePlanItem(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    const existing = readLocalPlanItems()
    writeLocalPlanItems(existing.filter(item => item.id !== id))
  }

  await tryFetch(`${API_BASE}/${id}`, { method: 'DELETE' })
}

export async function clearPlan(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.error('Failed to clear plan:', err)
    }
  }

  await tryFetch(API_BASE, { method: 'DELETE' })
}

export async function getPlanItemsByTool(toolId: string): Promise<PlanItem[]> {
  const items = await getPlanItems()
  return items.filter(item => item.toolId === toolId)
}
