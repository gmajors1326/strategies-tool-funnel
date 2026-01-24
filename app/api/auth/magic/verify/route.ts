import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSessionCookie, verifyOtp } from '@/lib/auth'

const MAX_ATTEMPTS = 5

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const next = searchParams.get('next') || '/account'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/account'

  if (!token || !email) {
    return NextResponse.redirect(new URL(`/verify?error=invalid_link`, request.url))
  }

  const otp = await prisma.otp.findFirst({
    where: {
      email,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) {
    return NextResponse.redirect(new URL(`/verify?error=expired`, request.url))
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return NextResponse.redirect(new URL(`/verify?error=too_many_attempts`, request.url))
  }

  const isValid = await verifyOtp(token, otp.codeHash)
  if (!isValid) {
    await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    })
    return NextResponse.redirect(new URL(`/verify?error=invalid_link`, request.url))
  }

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({ data: { email } })
  }

  if (!user.emailVerifiedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    })
  }

  await prisma.otp.delete({ where: { id: otp.id } })

  const res = NextResponse.redirect(new URL(safeNext, request.url))
  const sessionCookie = await createSessionCookie(user.id, user.email, user.plan)
  res.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)
  return res
}
