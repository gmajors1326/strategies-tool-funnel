import { prisma } from '@/src/lib/prisma'
import AdminAccessManager from './AdminAccessManager'

export const dynamic = 'force-dynamic'

export default async function AdminAccessPage() {
  let admins: Array<{ id: string; email: string; name: string | null; createdAt: Date | null }> = []
  let errorMessage: string | null = null
  try {
    admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, email: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch (err: any) {
    errorMessage = err?.message ?? 'Admin list unavailable.'
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Admin Access</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Manage who can access the admin area.</p>
      </div>
      {errorMessage && (
        <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200">
          {errorMessage}
        </div>
      )}
      <AdminAccessManager
        initialAdmins={admins.map((admin) => ({
          ...admin,
          createdAt: admin.createdAt?.toISOString(),
        }))}
      />
    </section>
  )
}
