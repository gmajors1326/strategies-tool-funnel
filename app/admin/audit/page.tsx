import { redirect } from 'next/navigation'
import { Table } from '@/components/app/Table'
import { getAdminSession } from '@/lib/adminAuth'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

const formatMeta = (meta: unknown) => {
  if (!meta) return ''
  try {
    const text = JSON.stringify(meta)
    return text.length > 140 ? `${text.slice(0, 140)}...` : text
  } catch {
    return '[meta unavailable]'
  }
}

export default async function AdminAuditPage() {
  const admin = await getAdminSession()
  if (admin.role !== 'admin') {
    redirect('/admin/not-authorized')
  }

  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Audit Log</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Recent admin actions across the platform.</p>
      </div>

      <Table
        headers={['Time', 'Actor', 'Action', 'Target', 'Meta']}
        rows={logs.map((log) => [
          new Date(log.createdAt).toLocaleString(),
          log.actorEmail ?? 'unknown',
          log.action,
          log.target ?? '-',
          formatMeta(log.meta),
        ])}
      />
    </section>
  )
}
