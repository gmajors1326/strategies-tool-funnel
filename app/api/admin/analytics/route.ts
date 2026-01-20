import { NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { getMockAnalytics } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  return NextResponse.json(getMockAnalytics())
}
