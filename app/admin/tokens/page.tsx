import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import AdminTokensPanel from './AdminTokensPanel'

export default async function AdminTokensPage() {
  await requireAdmin()

  return <AdminTokensPanel />
}
