import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const admin = await requireAdminAccess(request, { action: 'admin.whoami', policy: 'any' })
  return NextResponse.json({
    admin: {
      id: admin.userId,
      email: admin.email,
      role: admin.role,
    },
  })
}
