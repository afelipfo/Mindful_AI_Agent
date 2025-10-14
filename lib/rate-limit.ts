import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis instance
// Note: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN will be auto-configured by Vercel
// For local development, you can leave them empty and use in-memory rate limiting
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined

// Create a new ratelimiter that allows 10 requests per 1 minute window
export const generalRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null

// Stricter rate limit for expensive AI operations (5 requests per minute)
export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:ai',
    })
  : null

// Very strict rate limit for file uploads (3 uploads per minute)
export const uploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit:upload',
    })
  : null

// Auth operations rate limit (20 per hour to prevent brute force)
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: '@upstash/ratelimit:auth',
    })
  : null

/**
 * In-memory fallback rate limiter for development
 */
class InMemoryRateLimiter {
  private requests = new Map<string, number[]>()
  private limit: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.limit = maxRequests
    this.windowMs = windowMs
  }

  async limit(identifier: string) {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Get existing requests for this identifier
    const existing = this.requests.get(identifier) || []

    // Filter out old requests outside the window
    const recentRequests = existing.filter(time => time > windowStart)

    // Add current request
    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)

    // Check if limit exceeded
    const success = recentRequests.length <= this.limit
    const remaining = Math.max(0, this.limit - recentRequests.length)

    return {
      success,
      limit: this.limit,
      remaining,
      reset: new Date(now + this.windowMs),
    }
  }
}

// Fallback in-memory rate limiters for local development
const inMemoryGeneralLimit = new InMemoryRateLimiter(10, 60000) // 10 per minute
const inMemoryAiLimit = new InMemoryRateLimiter(5, 60000) // 5 per minute
const inMemoryUploadLimit = new InMemoryRateLimiter(3, 60000) // 3 per minute
const inMemoryAuthLimit = new InMemoryRateLimiter(20, 3600000) // 20 per hour

/**
 * Helper function to apply rate limiting with fallback
 */
export async function applyRateLimit(
  identifier: string,
  type: 'general' | 'ai' | 'upload' | 'auth' = 'general'
) {
  // Use Upstash if available, otherwise fallback to in-memory
  if (redis) {
    const limiter = type === 'ai'
      ? aiRateLimit
      : type === 'upload'
      ? uploadRateLimit
      : type === 'auth'
      ? authRateLimit
      : generalRateLimit

    if (!limiter) {
      return { success: true, limit: 0, remaining: 0, reset: new Date() }
    }

    return await limiter.limit(identifier)
  } else {
    // In-memory fallback
    const limiter = type === 'ai'
      ? inMemoryAiLimit
      : type === 'upload'
      ? inMemoryUploadLimit
      : type === 'auth'
      ? inMemoryAuthLimit
      : inMemoryGeneralLimit

    return await limiter.limit(identifier)
  }
}
