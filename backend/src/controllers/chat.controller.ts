import { Request, Response } from 'express'
import { chatService } from '../services/chat.service.js'

class ChatController {
  /**
   * Get chat room by activity ID
   * GET /api/chat/rooms/:activityId
   */
  async getChatRoomByActivityId(req: Request, res: Response): Promise<void> {
    try {
      const { activityId } = req.params
      const userId = req.userId!

      // Get chat room
      const room = await chatService.getChatRoomByActivityId(activityId)

      if (!room) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: 'Chat room not found for this activity',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check access
      const hasAccess = await chatService.checkRoomAccess(room.id, userId)

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this chat room',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      res.json({
        success: true,
        data: room,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching chat room:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch chat room',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get chat messages for a room
   * GET /api/chat/rooms/:roomId/messages
   */
  async getChatMessages(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params
      const userId = req.userId!
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 50

      // Validate pagination
      if (page < 1 || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_INVALID_FORMAT',
            message: 'Invalid pagination parameters',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check if room exists
      const room = await chatService.getChatRoomById(roomId)

      if (!room) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ROOM_NOT_FOUND',
            message: 'Chat room not found',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Check access
      const hasAccess = await chatService.checkRoomAccess(roomId, userId)

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this chat room',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      // Get messages
      const { messages, total } = await chatService.getMessages(roomId, page, limit)

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
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch chat messages',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }
}

export const chatController = new ChatController()
