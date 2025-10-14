import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from './rate-limit'

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  // Use user ID if available for authenticated requests
  if (userId) {
    return `user:${userId}`
  }

  // Otherwise use IP address
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-client-ip') ??
    request.headers.get('cf-connecting-ip') ??
    '127.0.0.1'

  return `ip:${ip}`
}

/**
 * Middleware to check rate limits
 */
export async function withRateLimit(
  request: NextRequest,
  type: 'general' | 'ai' | 'upload' | 'auth' = 'general',
  userId?: string
): Promise<NextResponse | null> {
  const identifier = getRateLimitIdentifier(request, userId)

  const { success, limit, remaining, reset } = await applyRateLimit(identifier, type)

  // Add rate limit headers
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', limit.toString())
  headers.set('X-RateLimit-Remaining', remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(reset).toISOString())

  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter: new Date(reset).toISOString(),
      },
      {
        status: 429,
        headers,
      }
    )
  }

  // Return null to indicate success (no response needed)
  return null
}

/**
 * Helper to add rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toISOString())
  return response
}
