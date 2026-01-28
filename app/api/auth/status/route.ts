import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth.server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()

  return NextResponse.json({
    signedIn: Boolean(session?.userId),
    email: session?.email || null,
  })
}
