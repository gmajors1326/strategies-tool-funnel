'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type WebhookDelivery = {
  id: string
  eventId: string
  type: string
  customerId?: string | null
  status: string
  receivedAt: string
  processedAt?: string | null
  errorMessage?: string | null
}

type WebhookSecret = {
  id: string
  customerId: string
  secret: string
  active: boolean
  createdAt: string
  rotatedAt?: string | null
  lastUsedAt?: string | null
}

export default function WebhookDashboard() {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [secrets, setSecrets] = useState<WebhookSecret[]>([])
  const [customerId, setCustomerId] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    try {
      setError(null)
      const [deliveriesRes, secretsRes] = await Promise.all([
        fetch('/api/admin/webhooks/deliveries', { cache: 'no-store' }),
        fetch('/api/admin/webhooks/secrets', { cache: 'no-store' }),
      ])

      if (!deliveriesRes.ok || !secretsRes.ok) {
        throw new Error('Failed to load webhook data')
      }

      const deliveriesJson = await deliveriesRes.json()
      const secretsJson = await secretsRes.json()
      setDeliveries(deliveriesJson.deliveries || [])
      setSecrets(secretsJson.secrets || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load data')
    }
  }

  const handleRotate = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/webhooks/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, secret }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || 'Failed to rotate secret')
      }
      setCustomerId('')
      setSecret('')
      await loadData()
    } catch (err: any) {
      setError(err?.message || 'Failed to rotate secret')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-sm font-medium text-zinc-200 mb-3">Rotate Secret</div>
        <form onSubmit={handleRotate} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
          <div className="space-y-1">
            <Label htmlFor="customerId">Customer ID</Label>
            <Input
              id="customerId"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="cus_123..."
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="secret">Webhook Secret</Label>
            <Input
              id="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="whsec_..."
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Rotate'}
          </Button>
        </form>
        {error && <p className="text-sm text-red-300 mt-3">{error}</p>}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-sm font-medium text-zinc-200 mb-3">Secrets</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-2 text-left">Customer</th>
                <th className="py-2 text-left">Secret</th>
                <th className="py-2 text-left">Active</th>
                <th className="py-2 text-left">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((secretRow) => (
                <tr key={secretRow.id} className="border-b border-zinc-900">
                  <td className="py-2">{secretRow.customerId}</td>
                  <td className="py-2">{secretRow.secret}</td>
                  <td className="py-2">{secretRow.active ? 'Yes' : 'No'}</td>
                  <td className="py-2">
                    {secretRow.lastUsedAt ? new Date(secretRow.lastUsedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {secrets.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-zinc-500">
                    No secrets configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-sm font-medium text-zinc-200 mb-3">Recent Deliveries</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-2 text-left">Time</th>
                <th className="py-2 text-left">Event ID</th>
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Customer</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-zinc-900">
                  <td className="py-2">{new Date(delivery.receivedAt).toLocaleString()}</td>
                  <td className="py-2">{delivery.eventId}</td>
                  <td className="py-2">{delivery.type}</td>
                  <td className="py-2">{delivery.customerId || '—'}</td>
                  <td className="py-2">{delivery.status}</td>
                  <td className="py-2 text-red-300">{delivery.errorMessage || ''}</td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-zinc-500">
                    No deliveries recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
