import { requireAdminPage } from '@/src/lib/auth/requireAdmin'
import AnalyticsDashboard from './ui/AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  await requireAdminPage()

  return (
    <AnalyticsDashboard />
  )
}
