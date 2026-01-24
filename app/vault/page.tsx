import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'
import { VaultClient } from './VaultClient'

export const dynamic = 'force-dynamic'

export default async function VaultPage() {
  const user = await getUserOrThrow()
  const ent = getEntitlements(user)

  const items = await prisma.vaultItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, title: true, toolSlug: true, createdAt: true, body: true },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Vault</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Saved runs and templates.</p>
      </div>
      <VaultClient
        items={items.map((item) => ({
          id: item.id,
          title: item.title,
          toolSlug: item.toolSlug,
          createdAt: item.createdAt.toISOString(),
          tags: (item.body as any)?.tags ?? [],
        }))}
        canExport={ent.canExport}
      />
    </div>
  )
}
