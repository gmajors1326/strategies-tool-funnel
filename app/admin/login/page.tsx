import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminLoginClient from './AdminLoginClient'

export default async function AdminLoginPage() {
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin_session')?.value
  if (adminSession) {
    redirect('/admin/analytics')
  }

  return <AdminLoginClient />
}
