import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import { Errors } from '../utils/errors.js'

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
      throw Errors.unauthorized()
    }

    const { userId } = authService.verifyAccessToken(token)
    req.userId = userId
    next()
  } catch (error) {
    next(error)
  }
}

/** Safely get userId from request; throws if not authenticated */
export function requireUserId(req: Request): string {
  const userId = req.userId
  if (!userId) {
    throw Errors.unauthorized()
  }
  return userId
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
