import { notFound } from 'next/navigation'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function VaultItemPage({ params }: { params: { id: string } }) {
  const user = await getUserOrThrow()
  const item = await prisma.vaultItem.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true, title: true, toolSlug: true, createdAt: true, body: true },
  })

  if (!item) return notFound()

  const body = (item.body as any) || {}
  const input = body.input ?? {}
  const output = body.output ?? {}
  const exports = await prisma.exportEvent.findMany({
    where: { vaultItemId: item.id, userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{item.title}</h1>
          <p className="text-sm text-muted-foreground">
            {item.toolSlug || 'tool'} · {item.createdAt.toISOString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={`/api/vault/export?id=${item.id}&type=json`}>Export JSON</a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={`/api/vault/export?id=${item.id}&type=pdf`}>Export PDF</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/vault">Back</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Export history</h2>
          {exports.length ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {exports.map((entry) => (
                <div key={entry.id}>
                  {entry.type.toUpperCase()} · {new Date(entry.createdAt).toLocaleString()}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No exports yet.</p>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold">Inputs</h2>
          <pre className="mt-2 max-h-[320px] overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
            {JSON.stringify(input, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Outputs</h2>
          <pre className="mt-2 max-h-[420px] overflow-auto rounded-md border bg-muted/20 p-3 text-xs">
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
