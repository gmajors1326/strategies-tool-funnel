import { cookies } from 'next/headers'

export type AppUser = {
  id: string
  planId: 'free' | 'pro_monthly' | 'team' | 'lifetime'
}

export async function getUserOrThrow(): Promise<AppUser> {
  const c = await cookies()
  const fake = c.get('dev_user_id')?.value

  return {
    id: fake ?? 'dev-user',
    planId: 'free',
  }
}
