import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

function expectedToken(): string {
  return createHmac('sha256', process.env.APP_SECRET ?? '')
    .update(process.env.APP_PASSWORD ?? '')
    .digest('hex')
}

export function proxy(request: NextRequest) {
  // Cron endpoints: try bearer token first (for Vercel Cron)
  const cronPaths = ['/api/push/remind', '/api/email/digest']
  let cronAuthenticated = false
  if (cronPaths.includes(request.nextUrl.pathname)) {
    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${process.env.CRON_SECRET}`) {
      cronAuthenticated = true
    }
    // If bearer token is present and valid, skip cookie check
    if (cronAuthenticated) {
      return NextResponse.next()
    }
  }

  const cookie = request.cookies.get('vt-auth')
  const expected = expectedToken()

  let authenticated = false
  if (cookie?.value) {
    try {
      const cookieBytes = Buffer.from(cookie.value)
      const expectedBytes = Buffer.from(expected)
      if (cookieBytes.length === expectedBytes.length) {
        authenticated = timingSafeEqual(cookieBytes, expectedBytes)
      }
    } catch {
      authenticated = false
    }
  }

  if (!authenticated) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app', '/api/:path*'],
}
