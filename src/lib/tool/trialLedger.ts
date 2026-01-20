const trialUsage = new Set<string>()

const makeKey = (userId: string, toolId: string) => `${userId}:${toolId}`

export const getTrialState = (userId: string, toolId: string) => {
  const used = trialUsage.has(makeKey(userId, toolId))
  return { allowed: !used, used }
}

export const markTrialUsed = (userId: string, toolId: string) => {
  trialUsage.add(makeKey(userId, toolId))
}
