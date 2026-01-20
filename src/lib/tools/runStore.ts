import type { RunResponse } from '@/src/lib/tools/runTypes'

const runsByUser = new Map<string, RunResponse[]>()
const MAX_RUNS = 20

export const addRun = (userId: string, run: RunResponse) => {
  const existing = runsByUser.get(userId) ?? []
  const updated = [run, ...existing].slice(0, MAX_RUNS)
  runsByUser.set(userId, updated)
}

export const getRecentRuns = (userId: string) => {
  return runsByUser.get(userId) ?? []
}
