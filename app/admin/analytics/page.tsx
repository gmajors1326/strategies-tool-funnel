import { requireAdmin, canViewAnalytics } from '@/lib/adminAuth'
import AnalyticsDashboard from './ui/AnalyticsDashboard'

export default async function AdminAnalyticsPage() {
  try {
    const admin = await requireAdmin()
    if (!canViewAnalytics(admin.role)) {
      return (
        <div className="p-6 text-sm text-red-300">
          Forbidden — your role can’t view analytics.
        </div>
      )
    }
  } catch {
    return (
      <div className="p-6 text-sm text-red-300">
        Unauthorized. Please sign in at <a href="/admin/login" className="underline">/admin/login</a>.
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-400">
          Global performance, tool usage, funnels, AI cost, and error surface.
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  )
}
