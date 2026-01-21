import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

type CreatePlanItemBody = {
  toolId: string
  title: string
  inputs: Record<string, any>
  outputs: Record<string, any>
  clientTempId?: string
}

function mapPlanItem(item: {
  id: string
  toolId: string
  title: string
  inputs: unknown
  outputs: unknown
  createdAt: Date
}) {
  return {
    id: item.id,
    toolId: item.toolId,
    title: item.title,
    inputs: item.inputs,
    outputs: item.outputs,
    timestamp: item.createdAt.getTime(),
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser()
  const { searchParams } = new URL(req.url)
  const toolId = searchParams.get('toolId') ?? undefined

  const items = await prisma.planItem.findMany({
    where: {
      userId: user.id,
      ...(toolId ? { toolId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ items: items.map(mapPlanItem) })
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  const body = (await req.json()) as CreatePlanItemBody

  if (!body?.toolId || !body?.title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const item = await prisma.planItem.create({
    data: {
      userId: user.id,
      toolId: body.toolId,
      title: body.title,
      inputs: body.inputs ?? {},
      outputs: body.outputs ?? {},
    },
  })

  return NextResponse.json({ item: mapPlanItem(item), clientTempId: body.clientTempId ?? null })
}

export async function DELETE() {
  const user = await requireUser()
  await prisma.planItem.deleteMany({ where: { userId: user.id } })
  return NextResponse.json({ ok: true })
}
