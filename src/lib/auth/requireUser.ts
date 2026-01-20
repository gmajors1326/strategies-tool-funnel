type UserSession = {
  id: string
  email: string
  planId: 'free' | 'pro_monthly' | 'lifetime' | 'team'
  role?: 'user' | 'admin'
}

export const requireUser = async (): Promise<UserSession> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Auth not configured in production.')
  }

  return {
    id: 'user_dev_1',
    email: 'dev@example.com',
    planId: 'pro_monthly',
    role: 'user',
  }
}
