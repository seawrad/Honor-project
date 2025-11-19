import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import { monitoring } from '../utils/monitoring.js'

// Error response interface
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}

// Centralized error handling middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error with context
  const errorContext = {
    path: req.path,
    method: req.method,
    userId: req.userId,
    body: req.body,
    query: req.query,
    params: req.params,
  }
  
  logger.logError(err, errorContext)
  
  // Send to monitoring service for non-client errors
  if (!(err instanceof AppError) || err.statusCode >= 500) {
    monitoring.captureException(err, errorContext)
  }

  // Handle known application errors
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date().toISOString(),
    }

    res.status(err.statusCode).json(errorResponse)
    return
  }

  // Handle unknown errors
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    },
    timestamp: new Date().toISOString(),
  }

  res.status(500).json(errorResponse)
}

// Async error wrapper to catch errors in async route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 Not Found handler
export function notFoundHandler(req: Request, res: Response): void {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  }

  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  })

  res.status(404).json(errorResponse)
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime
    logger.logRequest(req.method, req.path, res.statusCode, duration, req.userId)
  })

  next()
}
