import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await requireAdminAccess(request, {
    action: 'admin.diagnostics.supabase',
    policy: 'admin',
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'missing_supabase_env',
      },
      { status: 503 }
    )
  }

  const healthUrl = `${url}/auth/v1/health`
  const start = Date.now()

  try {
    const res = await fetch(healthUrl, {
      headers: {
        apikey: anon,
      },
      cache: 'no-store',
    })
    const latency = Date.now() - start

    return NextResponse.json(
      {
        status: res.ok ? 'healthy' : 'unhealthy',
        latency,
        httpStatus: res.status,
      },
      { status: res.ok ? 200 : 503 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error?.message ?? 'supabase_unreachable',
      },
      { status: 503 }
    )
  }
}
