import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminLoginClient from './AdminLoginClient'

type AdminLoginPageProps = {
  searchParams?: { force?: string }
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const cookieStore = await cookies()
  if (searchParams?.force === '1') {
    cookieStore.delete('admin_session')
  }
  const adminSession = cookieStore.get('admin_session')?.value
  if (adminSession && searchParams?.force !== '1') {
    redirect('/admin/analytics')
  }

  return <AdminLoginClient />
}
