export interface RetryOptions {
  retries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
  shouldRetry?: (error: unknown) => boolean
}

const defaultOptions: Required<RetryOptions> = {
  retries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      return (
        message.includes("timeout") ||
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("50")
      )
    }
    return false
  },
}

function sleep(durationMs: number) {
  return new Promise((resolve) => setTimeout(resolve, durationMs))
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    retries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    shouldRetry,
  } = { ...defaultOptions, ...options }

  let attempt = 0
  let delay = initialDelayMs
  let lastError: unknown

  while (attempt <= retries) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === retries || !shouldRetry(error)) {
        break
      }
      await sleep(Math.min(delay, maxDelayMs))
      delay = Math.min(delay * backoffMultiplier, maxDelayMs)
      attempt += 1
    }
  }

  throw lastError
}

export async function retryFetch(input: RequestInfo | URL, init?: RequestInit, options?: RetryOptions) {
  return retry(() => fetch(input, init), options)
}
