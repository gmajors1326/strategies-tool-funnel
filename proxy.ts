import { NextResponse, type NextRequest } from 'next/server'

export function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', req.nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/admin/:path*'],
}
