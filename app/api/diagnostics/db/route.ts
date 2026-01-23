import { NextResponse } from 'next/server'
import { dbHealthCheck } from '@/src/lib/db/dbHealth'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 })
  }

  const result = await dbHealthCheck()
  return NextResponse.json(result)
}
