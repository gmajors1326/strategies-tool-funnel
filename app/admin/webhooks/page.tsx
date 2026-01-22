import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import WebhookDashboard from './ui/WebhookDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminWebhooksPage() {
  await requireAdmin()

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
