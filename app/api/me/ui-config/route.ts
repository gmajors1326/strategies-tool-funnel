import { NextResponse } from 'next/server'
import { buildUiConfig } from '@/src/lib/ui/resolveUiConfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(await buildUiConfig())
}
