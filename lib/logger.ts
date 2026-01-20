/**
 * Structured logging system
 * Provides consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.formatMessage('info', message, context))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context))
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error
        ? {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : { error: String(error) }),
    }

    console.error(this.formatMessage('error', message, errorContext))

    // In production, also send to error tracking service
    if (this.isProduction && typeof window === 'undefined') {
      // Server-side: Sentry will handle this
      // Client-side: Sentry SDK will handle this
    }
  }

  // API-specific logging helpers
  apiRequest(method: string, path: string, statusCode: number, duration?: number, context?: LogContext): void {
    const logContext: LogContext = {
      type: 'api_request',
      method,
      path,
      statusCode,
      ...(duration !== undefined && { durationMs: duration }),
      ...context,
    }

    if (statusCode >= 500) {
      this.error(`API ${method} ${path} failed`, undefined, logContext)
    } else if (statusCode >= 400) {
      this.warn(`API ${method} ${path} client error`, logContext)
    } else {
      this.info(`API ${method} ${path}`, logContext)
    }
  }

  // Database query logging
  dbQuery(operation: string, duration?: number, context?: LogContext): void {
    const logContext: LogContext = {
      type: 'db_query',
      operation,
      ...(duration !== undefined && { durationMs: duration }),
      ...context,
    }

    if (duration && duration > 1000) {
      this.warn(`Slow database query: ${operation}`, logContext)
    } else {
      this.debug(`Database query: ${operation}`, logContext)
    }
  }

  // AI usage logging
  aiUsage(toolKey: string, tokensIn: number, tokensOut: number, cost?: number, context?: LogContext): void {
    const logContext: LogContext = {
      type: 'ai_usage',
      toolKey,
      tokensIn,
      tokensOut,
      ...(cost !== undefined && { cost }),
      ...context,
    }

    this.info(`AI usage: ${toolKey}`, logContext)
  }

  // Authentication logging
  authEvent(event: string, userId?: string, context?: LogContext): void {
    const logContext: LogContext = {
      type: 'auth_event',
      event,
      ...(userId && { userId }),
      ...context,
    }

    this.info(`Auth: ${event}`, logContext)
  }

  // Rate limiting logging
  rateLimit(identifier: string, limit: number, window: string, context?: LogContext): void {
    const logContext: LogContext = {
      type: 'rate_limit',
      identifier,
      limit,
      window,
      ...context,
    }

    this.warn(`Rate limit exceeded: ${identifier}`, logContext)
  }
}

// Export singleton instance
export const logger = new Logger()
