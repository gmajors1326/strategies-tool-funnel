import Stripe from "stripe"
import { NextRequest, NextResponse } from "next/server"
import { sendLeadNotification } from "@/lib/email"

export const dynamic = "force-dynamic"

type RateEntry = { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateEntry>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 1000

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for") || ""
  return forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function rateLimitOk(ip: string) {
  const now = Date.now()
  const existing = rateLimitStore.get(ip)
  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (existing.count >= RATE_LIMIT_MAX) return false
  existing.count += 1
  return true
}

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: "2023-10-16", typescript: true })
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 })
  }

  let email = ""
  let source = "open_tools"
  try {
    const body = await req.json()
    email = normalizeEmail(String(body?.email || ""))
    source = String(body?.source || "open_tools")
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 })
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 })
  }

  const stripe = getStripeClient()
  let leadId: string | null = null

  if (stripe) {
    try {
      const existing = await stripe.customers.list({ email, limit: 1 })
      if (existing.data.length > 0) {
        const customer = existing.data[0]
        leadId = customer.id
        await stripe.customers.update(customer.id, {
          metadata: {
            lead_source: source,
            captured_at: new Date().toISOString(),
          },
        })
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: {
            lead_source: source,
            captured_at: new Date().toISOString(),
          },
        })
        leadId = customer.id
      }
    } catch {
      // ignore Stripe failures and continue
    }
  }

  try {
    await sendLeadNotification(email, source, ip)
  } catch {
    // best-effort
  }

  return NextResponse.json({
    ok: true,
    leadId: leadId || `lead_${Buffer.from(email).toString("base64url").slice(0, 12)}`,
  })
}
