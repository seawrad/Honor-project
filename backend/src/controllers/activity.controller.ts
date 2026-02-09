import { Request, Response } from 'express'
import { activityService } from '../services/activity.service.js'
import { ValidationError } from '../utils/validation.js'
import { CreateActivityRequest, UpdateActivityRequest, ActivitySearchFilters, CreateRatingRequest } from '../types/activity.types.js'

class ActivityController {
  /**
   * POST /api/activities - Create a new activity
   */
  async createActivity(req: Request, res: Response): Promise<void> {
    try {
      const creatorId = req.userId!
      const data: CreateActivityRequest = {
        title: req.body.title,
        description: req.body.description,
        scheduledDate: req.body.scheduledDate,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        address: req.body.address,
        route: req.body.route,
        distance: req.body.distance,
        maxParticipants: req.body.maxParticipants,
        activityType: req.body.activityType || 'route-based',
        durationMinutes: req.body.durationMinutes,
        endLatitude: req.body.endLatitude,
        endLongitude: req.body.endLongitude,
        endAddress: req.body.endAddress,
      }

      const activity = await activityService.createActivity(creatorId, data)

      res.status(201).json({
        success: true,
        data: activity,
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
        console.error('Error in createActivity:', error)
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
   * GET /api/activities/:id - Get activity details
   */
  async getActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const activity = await activityService.getActivityById(id)

      res.json({
        success: true,
        data: activity,
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
        console.error('Error in getActivity:', error)
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
   * PUT /api/activities/:id - Update activity
   */
  async updateActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.userId!
      const updates: UpdateActivityRequest = {
        title: req.body.title,
        description: req.body.description,
        scheduledDate: req.body.scheduledDate,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        address: req.body.address,
        route: req.body.route,
        distance: req.body.distance,
        maxParticipants: req.body.maxParticipants,
      }

      const activity = await activityService.updateActivity(id, userId, updates)

      res.json({
        success: true,
        data: activity,
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        let statusCode = 400
        if (error.code === 'ACTIVITY_NOT_FOUND') {
          statusCode = 404
        } else if (error.code === 'AUTH_FORBIDDEN') {
          statusCode = 403
        } else if (error.code === 'ACTIVITY_PAST_EDIT_DEADLINE') {
          statusCode = 409
        }

        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in updateActivity:', error)
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
   * DELETE /api/activities/:id - Cancel activity
   */
  async cancelActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.userId!

      await activityService.cancelActivity(id, userId)

      res.json({
        success: true,
        data: {
          message: 'Activity cancelled successfully',
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        let statusCode = 400
        if (error.code === 'ACTIVITY_NOT_FOUND') {
          statusCode = 404
        } else if (error.code === 'AUTH_FORBIDDEN') {
          statusCode = 403
        }

        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in cancelActivity:', error)
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
   * POST /api/activities/:id/join - Join an activity
   */
  async joinActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.userId!

      await activityService.joinActivity(id, userId)

      res.json({
        success: true,
        data: {
          message: 'Successfully joined activity',
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        let statusCode = 400
        if (error.code === 'ACTIVITY_NOT_FOUND') {
          statusCode = 404
        } else if (error.code === 'ACTIVITY_FULL' || error.code === 'ALREADY_JOINED') {
          statusCode = 409
        }

        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in joinActivity:', error)
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
   * DELETE /api/activities/:id/leave - Leave an activity
   */
  async leaveActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.userId!

      await activityService.leaveActivity(id, userId)

      res.json({
        success: true,
        data: {
          message: 'Successfully left activity',
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        let statusCode = 400
        if (error.code === 'ACTIVITY_NOT_FOUND') {
          statusCode = 404
        } else if (error.code === 'NOT_PARTICIPANT' || error.code === 'ACTIVITY_PAST_LEAVE_DEADLINE') {
          statusCode = 409
        }

        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in leaveActivity:', error)
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
   * GET /api/activities/feed - Get activity feed (from followed users)
   */
  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const { activities, total } = await activityService.getFeedForUser(userId, page, limit)
      res.json({
        success: true,
        data: activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Error in getFeed:', error)
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
   * GET /api/activities - Search and filter activities
   */
  async searchActivities(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20

      const filters: ActivitySearchFilters = {
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minDistance: req.query.minDistance ? parseFloat(req.query.minDistance as string) : undefined,
        maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : undefined,
        status: req.query.status as any,
        activityType: req.query.activityType as any,
      }

      const { activities, total } = await activityService.searchActivities(filters, page, limit)

      res.json({
        success: true,
        data: activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Error in searchActivities:', error)
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
   * POST /api/activities/:id/ratings - Create a rating for an activity
   */
  async createRating(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const userId = req.userId!
      const data: CreateRatingRequest = {
        rating: req.body.rating,
        feedback: req.body.feedback,
      }

      const rating = await activityService.createRating(id, userId, data)

      res.status(201).json({
        success: true,
        data: rating,
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        let statusCode = 400
        if (error.code === 'ACTIVITY_NOT_FOUND') {
          statusCode = 404
        } else if (error.code === 'NOT_PARTICIPANT' || error.code === 'DUPLICATE_RATING') {
          statusCode = 409
        }

        res.status(statusCode).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in createRating:', error)
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
   * GET /api/activities/:id/ratings - Get ratings for an activity
   */
  async getActivityRatings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const ratings = await activityService.getActivityRatings(id)

      res.json({
        success: true,
        data: ratings,
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
        console.error('Error in getActivityRatings:', error)
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

export const activityController = new ActivityController()
