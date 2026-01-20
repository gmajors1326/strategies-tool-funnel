/**
 * Sentry error tracking configuration
 * Initialize Sentry for both server and client-side error tracking
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'

export function initSentry() {
  if (!SENTRY_DSN) {
    // Sentry is optional - log warning but don't fail
    if (process.env.NODE_ENV === 'production') {
      console.warn('Sentry DSN not configured. Error tracking will be limited.')
    }
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: SENTRY_ENVIRONMENT === 'development',

    // Capture unhandled promise rejections
    captureUnhandledRejections: true,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Filter out sensitive headers
      if (event.request?.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
        sensitiveHeaders.forEach((header) => {
          if (event.request.headers[header]) {
            event.request.headers[header] = '[Filtered]'
          }
        })
      }

      // Filter out sensitive user data
      if (event.user) {
        // Only keep user ID, not email or other sensitive info
        event.user = {
          id: event.user.id,
        }
      }

      return event
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      'conduitPage',
      // Network errors that are not actionable
      'NetworkError',
      'Network request failed',
      // Chrome extension errors
      'chrome-extension://',
      // Safari extension errors
      'safari-extension://',
    ],

    // Don't send errors from localhost in production
    denyUrls: process.env.NODE_ENV === 'production' ? [/localhost/, /127\.0\.0\.1/] : [],
  })
}

// Helper to capture exceptions manually
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    })
  }
}

// Helper to capture messages
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    })
  }
}

// Helper to set user context
export function setUserContext(userId: string, email?: string) {
  if (SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      email: email ? '[Filtered]' : undefined, // Don't send email to Sentry
    })
  }
}

// Helper to clear user context (on logout)
export function clearUserContext() {
  if (SENTRY_DSN) {
    Sentry.setUser(null)
  }
}

// Helper to add breadcrumbs
export function addBreadcrumb(message: string, category: string, level: Sentry.SeverityLevel = 'info', data?: Record<string, unknown>) {
  if (SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
    })
  }
}
