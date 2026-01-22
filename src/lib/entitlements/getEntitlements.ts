import type { AppUser } from '@/src/lib/auth/getUser'

export type Entitlements = {
  canSeeHistory: boolean
  canSaveToVault: boolean
  canExport: boolean
  canExportTemplates: boolean
}

export function getEntitlements(user: AppUser): Entitlements {
  const isPaid = user.planId === 'pro_monthly' || user.planId === 'team' || user.planId === 'lifetime'

  return {
    canSeeHistory: isPaid,
    canSaveToVault: isPaid,
    canExport: isPaid,
    canExportTemplates: isPaid,
  }
}
