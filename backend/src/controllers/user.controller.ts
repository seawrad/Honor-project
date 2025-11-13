import { Request, Response } from 'express'
import { userService } from '../services/user.service.js'
import { ValidationError } from '../utils/validation.js'
import { UpdateProfileRequest } from '../types/user.types.js'

class UserController {
  /**
   * GET /api/users/:id - Get user profile
   */
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const requestingUserId = req.userId

      const profile = await userService.getUserProfile(id, requestingUserId)

      res.json({
        success: true,
        data: profile,
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in getUserProfile:', error)
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

  /**
   * PUT /api/users/:id - Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const requestingUserId = req.userId

      // Users can only update their own profile
      if (id !== requestingUserId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_FORBIDDEN',
            message: 'You can only update your own profile',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const updates: UpdateProfileRequest = {
        displayName: req.body.displayName,
        age: req.body.age,
      }

      const profile = await userService.updateProfile(id, updates)

      res.json({
        success: true,
        data: profile,
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        const statusCode = error.code === 'USER_NOT_FOUND' ? 404 : 400
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in updateProfile:', error)
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

  /**
   * DELETE /api/users/:id - Delete user account
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const requestingUserId = req.userId

      // Users can only delete their own account
      if (id !== requestingUserId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'AUTH_FORBIDDEN',
            message: 'You can only delete your own account',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      await userService.deleteAccount(id)

      res.json({
        success: true,
        data: {
          message: 'Account deleted successfully',
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(404).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in deleteAccount:', error)
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

  /**
   * POST /api/users/:id/follow - Follow a user
   */
  async followUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const followerId = req.userId!

      await userService.followUser(followerId, id)

      res.json({
        success: true,
        data: {
          message: 'Successfully followed user',
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        const statusCode = error.code === 'USER_NOT_FOUND' ? 404 : 400
        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in followUser:', error)
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

  /**
   * DELETE /api/users/:id/follow - Unfollow a user
   */
  async unfollowUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const followerId = req.userId!

      await userService.unfollowUser(followerId, id)

      res.json({
        success: true,
        data: {
          message: 'Successfully unfollowed user',
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in unfollowUser:', error)
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

  /**
   * GET /api/users/:id/followers - Get user's followers
   */
  async getFollowers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      const { users, total } = await userService.getFollowers(id, page, limit)

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Error in getFollowers:', error)
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

  /**
   * GET /api/users/:id/following - Get users that the user is following
   */
  async getFollowing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      const { users, total } = await userService.getFollowing(id, page, limit)

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Error in getFollowing:', error)
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

  /**
   * GET /api/users/search - Search users by display name
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const requestingUserId = req.userId

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Search query is required',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { users, total } = await userService.searchUsers(
        query,
        requestingUserId,
        page,
        limit
      )

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Error in searchUsers:', error)
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

export const userController = new UserController()
