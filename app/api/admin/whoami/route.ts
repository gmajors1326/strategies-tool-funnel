import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdmin()
  return NextResponse.json({
    admin: {
      id: admin.userId,
      email: admin.email,
      role: admin.role,
    },
  })
}
