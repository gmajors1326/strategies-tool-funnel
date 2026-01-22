import { canSupport } from '@/lib/adminAuth'
import { requireAdminPage } from '@/src/lib/auth/requireAdmin'
import WebhookDashboard from './ui/WebhookDashboard'

export default async function AdminWebhooksPage() {
  const admin = await requireAdminPage()
  if (!canSupport(admin.role)) {
    return (
      <div className="p-6 text-sm text-red-300">
        Forbidden — your role can’t view webhooks.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Webhook Admin</h1>
        <p className="text-sm text-zinc-400">
          Replay protection, per-customer secrets, and delivery history.
        </p>
      </div>
      <WebhookDashboard />
    </div>
  )
}
