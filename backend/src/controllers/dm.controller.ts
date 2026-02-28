import { Request, Response } from 'express'
import { requireUserId } from '../middleware/auth.middleware.js'
import { dmService } from '../services/dm.service.js'
import { ValidationError } from '../utils/validation.js'

class DMController {
  /**
   * POST /api/chat/dm/rooms - Get or create DM room with a friend
   */
  async getOrCreateRoom(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const otherUserId = req.body.otherUserId as string

      if (!otherUserId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'otherUserId is required',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const room = await dmService.getOrCreateDMRoom(userId, otherUserId)

      res.json({
        success: true,
        data: room,
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        const status = error.code === 'AUTH_FORBIDDEN' ? 403 : 400
        res.status(status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in getOrCreateRoom:', error)
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
   * GET /api/chat/dm/rooms - List user's DM rooms
   */
  async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const rooms = await dmService.getDMRooms(userId)

      res.json({
        success: true,
        data: rooms,
      })
    } catch (error) {
      console.error('Error in getDMRooms:', error)
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
   * GET /api/chat/dm/rooms/:roomId/messages
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params
      const userId = requireUserId(req)
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50

      const { messages, total } = await dmService.getMessages(roomId, userId, page, limit)

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(403).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in getDMMessages:', error)
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
   * POST /api/chat/dm/rooms/:roomId/messages
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params
      const userId = requireUserId(req)
      const content = req.body.content as string

      if (!content || typeof content !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'content is required',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const message = await dmService.saveMessage(roomId, userId, content)

      res.status(201).json({
        success: true,
        data: message,
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        const status = error.code === 'AUTH_FORBIDDEN' ? 403 : 400
        res.status(status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        console.error('Error in sendDMMessage:', error)
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

export const dmController = new DMController()
