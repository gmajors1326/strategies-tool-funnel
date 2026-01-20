/**
 * API authentication middleware helpers
 * Provides utilities for protecting API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './auth'
import { logger } from './logger'
import { getUserEntitlements } from './entitlements'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
    plan: string
  }
}

/**
 * Require authentication for API route
 * Returns user session or null
 */
export async function requireAuth(request: NextRequest): Promise<{
  session: { userId: string; email: string; plan: string } | null
  response: NextResponse | null
}> {
  const session = await getSession()

  if (!session) {
    logger.authEvent('unauthorized_api_access', undefined, {
      path: request.nextUrl.pathname,
      method: request.method,
    })

    return {
      session: null,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  return { session, response: null }
}

/**
 * Require specific plan for API route
 */
export async function requirePlan(
  request: NextRequest,
  requiredPlan: string | string[]
): Promise<{
  session: { userId: string; email: string; plan: string } | null
  response: NextResponse | null
}> {
  const authResult = await requireAuth(request)
  if (authResult.response) {
    return authResult
  }

  const { session } = authResult
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const requiredPlans = Array.isArray(requiredPlan) ? requiredPlan : [requiredPlan]
  const hasAccess = requiredPlans.includes(session.plan)

  if (!hasAccess) {
    logger.authEvent('insufficient_plan_access', session.userId, {
      path: request.nextUrl.pathname,
      method: request.method,
      userPlan: session.plan,
      requiredPlan: requiredPlans,
    })

    return {
      session,
      response: NextResponse.json(
        { error: 'Insufficient plan access', requiredPlan: requiredPlans },
        { status: 403 }
      ),
    }
  }

  return { session, response: null }
}

/**
 * Require specific entitlement for API route
 */
export async function requireEntitlement(
  request: NextRequest,
  entitlement: 'dmEngine' | 'strategy' | 'allAccess'
): Promise<{
  session: { userId: string; email: string; plan: string } | null
  entitlements: Awaited<ReturnType<typeof getUserEntitlements>> | null
  response: NextResponse | null
}> {
  const authResult = await requireAuth(request)
  if (authResult.response) {
    return {
      session: null,
      entitlements: null,
      response: authResult.response,
    }
  }

  const { session } = authResult
  if (!session) {
    return {
      session: null,
      entitlements: null,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const entitlements = await getUserEntitlements(session.userId)
  const hasEntitlement = entitlements[entitlement]

  if (!hasEntitlement) {
    logger.authEvent('insufficient_entitlement', session.userId, {
      path: request.nextUrl.pathname,
      method: request.method,
      requiredEntitlement: entitlement,
    })

    return {
      session,
      entitlements,
      response: NextResponse.json(
        { error: 'Insufficient entitlement', requiredEntitlement: entitlement },
        { status: 403 }
      ),
    }
  }

  return { session, entitlements, response: null }
}

/**
 * Wrapper for API route handlers with authentication
 */
export function withAuth<T = unknown>(
  handler: (request: NextRequest, session: { userId: string; email: string; plan: string }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const authResult = await requireAuth(request)
    if (authResult.response) {
      return authResult.response as NextResponse<T>
    }

    if (!authResult.session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ) as NextResponse<T>
    }

    return handler(request, authResult.session)
  }
}

/**
 * Wrapper for API route handlers with plan requirement
 */
export function withPlan<T = unknown>(
  requiredPlan: string | string[],
  handler: (request: NextRequest, session: { userId: string; email: string; plan: string }) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const authResult = await requirePlan(request, requiredPlan)
    if (authResult.response) {
      return authResult.response as NextResponse<T>
    }

    if (!authResult.session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ) as NextResponse<T>
    }

    return handler(request, authResult.session)
  }
}

/**
 * Wrapper for API route handlers with entitlement requirement
 */
export function withEntitlement<T = unknown>(
  entitlement: 'dmEngine' | 'strategy' | 'allAccess',
  handler: (
    request: NextRequest,
    session: { userId: string; email: string; plan: string },
    entitlements: Awaited<ReturnType<typeof getUserEntitlements>>
  ) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    const authResult = await requireEntitlement(request, entitlement)
    if (authResult.response) {
      return authResult.response as NextResponse<T>
    }

    if (!authResult.session || !authResult.entitlements) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ) as NextResponse<T>
    }

    return handler(request, authResult.session, authResult.entitlements)
  }
}
