import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'

export async function POST(req: Request) {
  try {
    const user = await getUserOrThrow()
    const body = (await req.json()) as { id?: string }
    if (!body?.id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 })

    await prisma.vaultItem.deleteMany({
      where: { id: body.id, userId: user.id },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Delete failed.' }, { status: 500 })
  }
}
