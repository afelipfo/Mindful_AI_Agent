/**
 * Standardized error handling utilities
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

/**
 * Log error with appropriate level
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const message = getErrorMessage(error)
  const isOperational = isOperationalError(error)

  if (isOperational) {
    console.warn('Operational error:', message, context)
  } else {
    console.error('Programming error:', error, context)
  }
}

/**
 * Handle API errors with consistent format
 */
export function handleApiError(error: unknown): {
  message: string
  statusCode: number
  isOperational: boolean
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    }
  }

  // Default to 500 for unknown errors
  return {
    message: 'Internal server error',
    statusCode: 500,
    isOperational: false,
  }
}
