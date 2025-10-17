import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    console.log('🔒 Middleware running for:', req.nextUrl.pathname)
    console.log('🔑 Has token:', !!req.nextauth?.token)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        console.log('✅ Authorization check:', {
          path: req.nextUrl.pathname,
          hasToken: !!token,
          tokenSub: token?.sub
        })
        // Allow access if there's a valid token with a user ID
        return !!token && !!token.sub
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    '/onboarding/:path*',
    '/dashboard/:path*',
    '/api/mood-entries/:path*',
    '/api/wellness-goals/:path*',
  ],
}
