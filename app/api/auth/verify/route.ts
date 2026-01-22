import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyOtp, createSessionCookie } from '@/lib/auth'
import { sendAdminNotification } from '@/lib/email'
import { z } from 'zod'

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = verifySchema.parse(body)

    // Find active OTP
    const otp = await prisma.otp.findFirst({
      where: {
        email,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new code' },
        { status: 429 }
      )
    }

    const isValid = await verifyOtp(code, otp.codeHash)

    if (!isValid) {
      await prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      })
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      user = await prisma.user.create({
        data: { email },
        include: { profile: true },
      })
    }

    if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      })
    }

    // Delete used OTP (one-time)
    await prisma.otp.delete({ where: { id: otp.id } })

    // Build response FIRST, then set cookie ON IT
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, plan: user.plan },
    })

    // Set session cookie reliably
    const sessionCookie = await createSessionCookie(user.id, user.email, user.plan)
    res.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)

    // Fire-and-forget admin notification (don’t block login on email)
    sendAdminNotification(user.email, user.name || undefined, user.profile || undefined).catch(() => {})

    return res
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }

    console.error('Auth verify error:', error)
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 })
  }
}
