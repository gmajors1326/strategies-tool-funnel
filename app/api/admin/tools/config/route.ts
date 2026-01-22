import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { listTools } from '@/src/lib/tools/registry'

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
  await requireAdmin()
  const body = await request.json()
  // TODO: replace (tool-registry): validate and persist tool config updates.
  mockToolConfig = body.tools ?? mockToolConfig
  return NextResponse.json({ status: 'ok', tools: mockToolConfig })
}
