import { Resend } from 'resend'
import nodemailer from 'nodemailer'

const USE_GMAIL_SMTP = process.env.USE_GMAIL_SMTP?.toLowerCase().trim() === 'true'
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim()
const RESEND_FROM = process.env.RESEND_FROM?.trim() || 'onboarding@resend.dev'
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME?.trim() || 'The Strategy Tools'
const GMAIL_USER = process.env.GMAIL_USER?.trim()
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD?.trim()
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim() || 'admin@example.com'

let resend: Resend | null = null
let gmailTransporter: nodemailer.Transporter | null = null

// Initialize email providers
if (USE_GMAIL_SMTP) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.error('[email] Gmail SMTP enabled but GMAIL_USER or GMAIL_APP_PASSWORD missing')
  } else {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    })
    console.info('[email] Gmail SMTP initialized')
  }
} else if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY)
  console.info('[email] Resend initialized')
} else {
  console.error('[email] No email provider configured - USE_GMAIL_SMTP:', USE_GMAIL_SMTP, 'RESEND_API_KEY:', RESEND_API_KEY ? 'set' : 'missing')
}

export async function sendVerificationCode(email: string, code: string, name?: string): Promise<void> {
  const provider = resend ? 'resend' : gmailTransporter ? 'gmail' : 'none'
  console.info('[email] sending via', provider, 'to', email)
  
  if (!resend && !gmailTransporter) {
    const error = 'No email provider configured. USE_GMAIL_SMTP=' + USE_GMAIL_SMTP + ', RESEND_API_KEY=' + (RESEND_API_KEY ? 'set' : 'missing') + ', GMAIL_USER=' + (GMAIL_USER ? 'set' : 'missing')
    console.error('[email]', error)
    throw new Error(error)
  }

  const subject = 'Your verification code'
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">The Strategy Tools</h1>
        </div>
        <div style="background: #ffffff; padding: 40px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${name ? `<p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>` : '<p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>'}
          <p style="font-size: 16px; margin-bottom: 20px;">Your verification code is:</p>
          <div style="background: #f7f7f7; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
  `

  try {
    if (resend) {
      const result = await resend.emails.send({
        from: `${RESEND_FROM_NAME} <${RESEND_FROM}>`,
        to: email,
        subject,
        html,
      })
      console.info('[email] Resend result:', result)
    } else if (gmailTransporter) {
      const result = await gmailTransporter.sendMail({
        from: GMAIL_USER!,
        to: email,
        subject,
        html,
      })
      console.info('[email] Gmail result:', result.messageId)
    }
  } catch (error: any) {
    console.error('[email] Send failed:', error.message, error.response || error)
    throw error
  }
}

export async function sendAdminNotification(email: string, name?: string, profileData?: any): Promise<void> {
  console.info('[email] admin provider', resend ? 'resend' : gmailTransporter ? 'gmail' : 'none')
  if (!ADMIN_EMAIL) return

  const subject = `New user verification: ${email}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">New User Verified</h2>
        <p><strong>Email:</strong> ${email}</p>
        ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
        ${profileData ? `
          <h3 style="margin-top: 20px;">Profile Data:</h3>
          <ul>
            ${profileData.followerRange ? `<li><strong>Follower Range:</strong> ${profileData.followerRange}</li>` : ''}
            ${profileData.postingFrequency ? `<li><strong>Posting Frequency:</strong> ${profileData.postingFrequency}</li>` : ''}
            ${profileData.primaryGoal ? `<li><strong>Primary Goal:</strong> ${profileData.primaryGoal}</li>` : ''}
            ${profileData.biggestFriction ? `<li><strong>Biggest Friction:</strong> ${profileData.biggestFriction}</li>` : ''}
          </ul>
        ` : ''}
        <p style="margin-top: 20px; font-size: 14px; color: #666;">This is an automated notification from The Strategy Tools.</p>
      </body>
    </html>
  `

  if (resend) {
    await resend.emails.send({
      from: `${RESEND_FROM_NAME} <${RESEND_FROM}>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    })
  } else if (gmailTransporter) {
    await gmailTransporter.sendMail({
      from: GMAIL_USER,
      to: ADMIN_EMAIL,
      subject,
      html,
    })
  }
}
