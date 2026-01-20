import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const fetchStatement = async (month: string) => {
  const headerList = headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/orgs/usage/statement?month=${month}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function StatementPage({ params, searchParams }: { params: { slug: string }; searchParams: { month?: string } }) {
  const month = searchParams.month || new Date().toISOString().slice(0, 7)
  const data = await fetchStatement(month)

  if (!data) {
    return <div className="p-6">Statement not available.</div>
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Monthly Statement · {month}</h1>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
          <p>Total tokens charged: {data.totalTokens}</p>
          <p>Total runs: {data.totalRuns}</p>
          <p>Locks: {data.locksCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
          <p className="text-sm font-semibold">Top tools</p>
          {data.topTools?.map((item: any) => (
            <div key={item[0]} className="flex justify-between text-xs text-[hsl(var(--muted))]">
              <span>{item[0]}</span>
              <span>{item[1]}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
          <p className="text-sm font-semibold">Top users</p>
          {data.topUsers?.map((item: any) => (
            <div key={item[0]} className="flex justify-between text-xs text-[hsl(var(--muted))]">
              <span>{item[0]}</span>
              <span>{item[1]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
