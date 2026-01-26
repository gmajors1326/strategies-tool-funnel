import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { listToolFeedback } from '@/src/lib/tool/feedback'
import { getBonusRunGrantExists } from '@/src/lib/tool/bonusRuns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  await requireAdminAccess(request, {
    action: 'admin.feedback.list',
    policy: 'support',
  })
  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('toolId') || undefined
  const userId = searchParams.get('userId') || undefined
  const limit = Number(searchParams.get('limit') || '50')

  const entries = await listToolFeedback({ userId, toolId, limit })
  const enriched = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      bonusGranted: await getBonusRunGrantExists({ userId: entry.user_id, toolId: entry.tool_id }),
    }))
  )

  return NextResponse.json({ feedback: enriched })
}
