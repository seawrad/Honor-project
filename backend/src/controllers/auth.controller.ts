import { Request, Response } from 'express'
import { authService } from '../services/auth.service.js'
import { RegisterRequest, LoginRequest } from '../types/auth.types.js'
import { ValidationError } from '../utils/validation.js'

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data: RegisterRequest = req.body

      const user = await authService.register(data)

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            age: user.age,
            createdAt: user.createdAt.toISOString(),
          },
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Registration error:', error)
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

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body

      const { user, accessToken, refreshToken } = await authService.login(email, password)

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            age: user.age,
            createdAt: user.createdAt.toISOString(),
          },
          accessToken,
          refreshToken,
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(error.code === 'AUTH_INVALID_CREDENTIALS' ? 401 : 400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Login error:', error)
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

  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId

      const user = await authService.getUserById(userId)

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            age: user.age,
            createdAt: user.createdAt.toISOString(),
          },
        },
      })
    } catch (error) {
      console.error('Get user error:', error)
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

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Refresh token is required',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { userId } = authService.verifyRefreshToken(refreshToken)
      const newAccessToken = authService.generateAccessToken(userId)

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      })
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
        console.error('Refresh token error:', error)
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
}

export const authController = new AuthController()
