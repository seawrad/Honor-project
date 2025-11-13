import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import { ValidationError } from '../utils/validation.js'

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: 'Access token is required',
        },
        timestamp: new Date().toISOString(),
      })
      return
    }

    const { userId } = authService.verifyAccessToken(token)
    req.userId = userId
    next()
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(401).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      })
    } else {
      console.error('Authentication error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const { userId } = authService.verifyAccessToken(token)
      req.userId = userId
    }

    next()
  } catch (error) {
    // For optional auth, we don't fail on invalid token
    next()
  }
}
