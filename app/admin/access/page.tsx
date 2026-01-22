import { prisma } from '@/src/lib/prisma'
import AdminAccessManager from './AdminAccessManager'

export const dynamic = 'force-dynamic'

export default async function AdminAccessPage() {
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Admin Access</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Manage who can access the admin area.</p>
      </div>
      <AdminAccessManager
        initialAdmins={admins.map((admin) => ({
          ...admin,
          createdAt: admin.createdAt?.toISOString(),
        }))}
      />
    </section>
  )
}
