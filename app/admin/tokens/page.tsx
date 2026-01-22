import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import AdminTokensPanel from './AdminTokensPanel'

export const dynamic = 'force-dynamic'

export default async function AdminTokensPage() {
  await requireAdmin()

  return <AdminTokensPanel />
}
