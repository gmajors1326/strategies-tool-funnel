type AdminSession = {
  id: string
  email: string
  role: 'admin'
}

export const requireAdmin = async (): Promise<AdminSession> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Admin auth not configured in production.')
  }

  return {
    id: 'admin_dev_1',
    email: 'admin@example.com',
    role: 'admin',
  }
}
