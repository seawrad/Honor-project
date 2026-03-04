import { Request, Response } from 'express'
import { requireUserId } from '../middleware/auth.middleware.js'
import { authService } from '../services/auth.service.js'
import { RegisterRequest, LoginRequest } from '../types/auth.types.js'
import { Errors } from '../utils/errors.js'

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
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
  }

  async login(req: Request, res: Response): Promise<void> {
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
          avatarUrl: (user as { avatarUrl?: string | null }).avatarUrl ?? null,
        },
        accessToken,
        refreshToken,
      },
    })
  }

  async me(req: Request, res: Response): Promise<void> {
    const userId = requireUserId(req)
    const user = await authService.getUserById(userId)

    if (!user) {
      throw Errors.userNotFound()
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
          avatarUrl: (user as { avatarUrl?: string | null }).avatarUrl ?? null,
        },
      },
    })
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw Errors.requiredField('refreshToken')
    }

    const { userId } = authService.verifyRefreshToken(refreshToken)
    const newAccessToken = authService.generateAccessToken(userId)

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    })
  }
}

export const authController = new AuthController()
