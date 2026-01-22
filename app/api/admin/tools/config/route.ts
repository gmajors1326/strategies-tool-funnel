import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { listTools } from '@/src/lib/tools/registry'
import { logAdminAudit } from '@/src/lib/admin/audit'

// TODO: replace (tool-registry): persist tool config to database.
let mockToolConfig = listTools({ includeHidden: true }).map((tool) => ({
  id: tool.id,
  name: tool.name,
  tokensPerRun: tool.tokensPerRun,
  dailyRunsByPlan: tool.dailyRunsByPlan,
}))

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  // TODO: replace (tool-registry): load tool config from database.
  return NextResponse.json({ tools: mockToolConfig })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  const body = await request.json()
  // TODO: replace (tool-registry): validate and persist tool config updates.
  mockToolConfig = body.tools ?? mockToolConfig
  await logAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: 'admin.tools.config_update',
    meta: { toolCount: mockToolConfig.length },
  })
  return NextResponse.json({ status: 'ok', tools: mockToolConfig })
}
