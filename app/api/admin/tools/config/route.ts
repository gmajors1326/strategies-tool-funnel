import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { TOOL_REGISTRY } from '@/src/lib/tools/registry'

let mockToolConfig = TOOL_REGISTRY.map((tool) => ({
  id: tool.id,
  name: tool.name,
  tokensPerRun: tool.tokensPerRun,
  dailyRunsByPlan: tool.dailyRunsByPlan,
  enabled: tool.enabled,
}))

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  return NextResponse.json({ tools: mockToolConfig })
}

export async function POST(request: NextRequest) {
  await requireAdmin()
  const body = await request.json()
  mockToolConfig = body.tools ?? mockToolConfig
  return NextResponse.json({ status: 'ok', tools: mockToolConfig })
}
