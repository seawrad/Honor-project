import { Request, Response } from 'express'
import { notificationService } from '../services/notification.service.js'
import { CreateNotificationRequest } from '../types/notification.types.js'

export class NotificationController {
  /**
   * Create a notification (internal use)
   * POST /api/notifications
   */
  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateNotificationRequest = req.body

      // Validate required fields
      if (!data.userId || !data.type || !data.title || !data.message) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Missing required fields: userId, type, title, message',
          },
        })
        return
      }

      const notification = await notificationService.createNotification(data)

      res.status(201).json({
        success: true,
        data: notification,
      })
    } catch (error) {
      console.error('Error creating notification:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create notification',
        },
      })
    }
  }

  /**
   * Get user notifications
   * GET /api/notifications
   */
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: 'User not authenticated',
          },
        })
        return
      }

      const limit = parseInt(req.query.limit as string) || 50
      const offset = parseInt(req.query.offset as string) || 0

      const result = await notificationService.getUserNotifications(userId, limit, offset)

      res.json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notifications',
        },
      })
    }
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId
      const notificationId = req.params.id

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: 'User not authenticated',
          },
        })
        return
      }

      const notification = await notificationService.markAsRead(notificationId, userId)

      if (!notification) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Notification not found',
          },
        })
        return
      }

      res.json({
        success: true,
        data: notification,
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notification as read',
        },
      })
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: 'User not authenticated',
          },
        })
        return
      }

      const count = await notificationService.markAllAsRead(userId)

      res.json({
        success: true,
        data: {
          markedCount: count,
        },
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read',
        },
      })
    }
  }

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId
      const notificationId = req.params.id

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: 'User not authenticated',
          },
        })
        return
      }

      const deleted = await notificationService.deleteNotification(notificationId, userId)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Notification not found',
          },
        })
        return
      }

      res.json({
        success: true,
        data: {
          deleted: true,
        },
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete notification',
        },
      })
    }
  }
}

export const notificationController = new NotificationController()
