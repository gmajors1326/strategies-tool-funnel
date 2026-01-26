import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { listTools } from '@/src/lib/tools/registry'

// TODO: replace (tool-registry): persist tool config to database.
let mockToolConfig = listTools({ includeHidden: true }).map((tool) => ({
  id: tool.id,
  name: tool.name,
  tokensPerRun: tool.tokensPerRun,
  dailyRunsByPlan: tool.dailyRunsByPlan,
}))

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await requireAdminAccess(request, { action: 'admin.tools.config.list', policy: 'admin' })
  // TODO: replace (tool-registry): load tool config from database.
  return NextResponse.json({ tools: mockToolConfig })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  await requireAdminAccess(request, {
    action: 'admin.tools.config_update',
    policy: 'admin',
    meta: { toolCount: Array.isArray(body?.tools) ? body.tools.length : undefined },
  })
  // TODO: replace (tool-registry): validate and persist tool config updates.
  mockToolConfig = body.tools ?? mockToolConfig
  return NextResponse.json({ status: 'ok', tools: mockToolConfig })
}
