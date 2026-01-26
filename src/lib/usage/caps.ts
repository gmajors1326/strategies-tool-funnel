export const dailyAiTokenCapByPlan: Record<'free' | 'pro_monthly' | 'team' | 'lifetime', number> = {
  free: 200,
  pro_monthly: 2000,
  team: 6000,
  lifetime: 2000,
}

export const dailyRunCapByPlan: Record<'free' | 'pro_monthly' | 'team' | 'lifetime', number> = {
  free: 5,
  pro_monthly: 50,
  team: 200,
  lifetime: 50,
}

export const orgAiTokenCapByPlan: Record<'business' | 'enterprise', number> = {
  business: 6000,
  enterprise: 200000,
}

export const orgRunCapByPlan: Record<'business' | 'enterprise', number> = {
  business: 200,
  enterprise: 500,
}
