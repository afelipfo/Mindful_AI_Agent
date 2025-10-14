/**
 * Retry utility with exponential backoff
 */

interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  shouldRetry?: (error: unknown) => boolean
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  shouldRetry: (error) => {
    // Retry on network errors and 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('fetch') ||
        message.includes('50')
      )
    }
    return false
  },
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        break
      }

      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      )

      console.warn(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms`, error)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Retry a fetch request
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(url, init)

    // Throw error for non-ok responses to trigger retry
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response
  }, options)
}
