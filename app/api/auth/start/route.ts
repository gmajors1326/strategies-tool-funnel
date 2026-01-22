import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashOtp } from '@/lib/auth'
import { sendVerificationCode } from '@/lib/email'
import { z } from 'zod'

const startSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email(),
})

const OTP_EXPIRY_MINUTES = 10
// MAX_ATTEMPTS removed - not currently used in this route

export async function POST(request: NextRequest) {
  try {
    try {
      if (process.env.DATABASE_URL) {
        const dbUrl = new URL(process.env.DATABASE_URL)
        console.info('[auth/start] DB host:', dbUrl.host, 'db:', dbUrl.pathname.replace('/', ''))
      }
    } catch {
      console.info('[auth/start] DB host: unavailable')
    }
    const body = await request.json()
    const { name, email } = startSchema.parse(body)

    // Rate limiting: Check for recent OTP requests
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Last minute
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentOtp) {
      return NextResponse.json(
        { error: 'Please wait before requesting another code' },
        { status: 429 }
      )
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = await hashOtp(code)

    // Expiry time
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Create or update user FIRST (required for foreign key constraint)
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: name || null,
      },
      update: {
        name: name || undefined,
      },
    })

    // Clean up old OTPs
    await prisma.otp.deleteMany({
      where: {
        email,
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    // Create or update OTP (after User exists)
    await prisma.otp.create({
      data: {
        email,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    })

    // Send email
    await sendVerificationCode(email, code, name || undefined)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[auth/start] Error:', errorMessage)
    console.error('[auth/start] Stack:', error instanceof Error ? error.stack : 'No stack')

    if (
      errorMessage.includes('No email provider configured') ||
      errorMessage.includes('Gmail SMTP enabled but')
    ) {
      return NextResponse.json(
        {
          error: 'Email provider not configured',
          code: 'email_not_configured',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }

    if (
      errorMessage.includes('eauth') ||
      errorMessage.includes('invalid login') ||
      errorMessage.includes('username and password not accepted') ||
      errorMessage.includes('535')
    ) {
      return NextResponse.json(
        {
          error: 'Email authentication failed',
          code: 'gmail_auth_failed',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }

    if (errorMessage.includes('enotfound') || errorMessage.includes('getaddrinfo')) {
      return NextResponse.json(
        {
          error: 'Email provider network error',
          code: 'email_network_error',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to send verification code',
        code: 'send_failed',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}
