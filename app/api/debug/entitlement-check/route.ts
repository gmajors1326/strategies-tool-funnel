import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  let dbHost: string | null = null
  let dbName: string | null = null
  try {
    if (process.env.DATABASE_URL) {
      const dbUrl = new URL(process.env.DATABASE_URL)
      dbHost = dbUrl.host
      dbName = dbUrl.pathname.replace('/', '')
    }
  } catch {
    // ignore malformed URL
  }

  try {
    const [entCapital] = await prisma.$queryRawUnsafe<
      { ent_capital: string | null }[]
    >(`select to_regclass('public."Entitlement"')::text as ent_capital;`)
    const [entLower] = await prisma.$queryRawUnsafe<
      { ent_lower: string | null }[]
    >(`select to_regclass('public.entitlement')::text as ent_lower;`)

    return NextResponse.json({
      dbHost,
      dbName,
      ent_capital: entCapital?.ent_capital ?? null,
      ent_lower: entLower?.ent_lower ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'entitlement_check_failed',
        dbHost,
        dbName,
        details: message,
      },
      { status: 500 }
    )
  }
}
