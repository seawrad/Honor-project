import { Server } from 'socket.io'
import {
  AuthenticatedSocket,
  JoinRoomPayload,
  LeaveRoomPayload,
  SendMessagePayload,
  MessageReceivedPayload,
  UserJoinedPayload,
  UserLeftPayload,
  ErrorPayload,
} from '../types/socket.types.js'
import { chatService } from '../services/chat.service.js'
import { notificationService } from '../services/notification.service.js'
import { db } from '../database/db.js'

/**
 * Setup chat event handlers for Socket.io
 */
export function setupChatHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId

    if (!userId) {
      socket.disconnect()
      return
    }

    console.log(`User ${userId} connected with socket ${socket.id}`)

    /**
     * Handle join_room event
     */
    socket.on('join_room', async (payload: JoinRoomPayload) => {
      try {
        const { roomId } = payload

        if (!roomId) {
          const error: ErrorPayload = {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Room ID is required',
          }
          socket.emit('error', error)
          return
        }

        // Check if room exists
        const room = await chatService.getChatRoomById(roomId)
        if (!room) {
          const error: ErrorPayload = {
            code: 'ROOM_NOT_FOUND',
            message: 'Chat room not found',
          }
          socket.emit('error', error)
          return
        }

        // Check access control
        const hasAccess = await chatService.checkRoomAccess(roomId, userId)
        if (!hasAccess) {
          const error: ErrorPayload = {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this chat room',
          }
          socket.emit('error', error)
          return
        }

        // Join the room
        socket.join(roomId)
        console.log(`User ${userId} joined room ${roomId}`)

        // Get user display name
        const userResult = await db.query(
          'SELECT display_name FROM users WHERE id = $1',
          [userId]
        )

        // Notify other users in the room
        const userJoined: UserJoinedPayload = {
          userId,
          displayName: userResult.rows[0].display_name,
        }
        socket.to(roomId).emit('user_joined', userJoined)

        // Confirm join to the user
        socket.emit('joined_room', { roomId })
      } catch (error) {
        console.error('Error handling join_room:', error)
        const errorPayload: ErrorPayload = {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to join room',
        }
        socket.emit('error', errorPayload)
      }
    })

    /**
     * Handle leave_room event
     */
    socket.on('leave_room', async (payload: LeaveRoomPayload) => {
      try {
        const { roomId } = payload

        if (!roomId) {
          const error: ErrorPayload = {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Room ID is required',
          }
          socket.emit('error', error)
          return
        }

        // Leave the room
        socket.leave(roomId)
        console.log(`User ${userId} left room ${roomId}`)

        // Notify other users in the room
        const userLeft: UserLeftPayload = {
          userId,
        }
        socket.to(roomId).emit('user_left', userLeft)

        // Confirm leave to the user
        socket.emit('left_room', { roomId })
      } catch (error) {
        console.error('Error handling leave_room:', error)
        const errorPayload: ErrorPayload = {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to leave room',
        }
        socket.emit('error', errorPayload)
      }
    })

    /**
     * Handle send_message event
     */
    socket.on('send_message', async (payload: SendMessagePayload) => {
      try {
        const { roomId, content } = payload

        if (!roomId || !content) {
          const error: ErrorPayload = {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Room ID and content are required',
          }
          socket.emit('error', error)
          return
        }

        // Check if room exists
        const room = await chatService.getChatRoomById(roomId)
        if (!room) {
          const error: ErrorPayload = {
            code: 'ROOM_NOT_FOUND',
            message: 'Chat room not found',
          }
          socket.emit('error', error)
          return
        }

        // Check access control
        const hasAccess = await chatService.checkRoomAccess(roomId, userId)
        if (!hasAccess) {
          const error: ErrorPayload = {
            code: 'ACCESS_DENIED',
            message: 'You do not have access to this chat room',
          }
          socket.emit('error', error)
          return
        }

        // Save message to database
        const message = await chatService.saveMessage(roomId, userId, content)

        // Broadcast message to all users in the room (including sender)
        const messagePayload: MessageReceivedPayload = {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: message.timestamp,
        }

        io.to(roomId).emit('message_received', messagePayload)
        console.log(`Message sent in room ${roomId} by user ${userId}`)

        // Get activity ID and participants for notifications
        const activityResult = await db.query(
          'SELECT activity_id FROM chat_rooms WHERE id = $1',
          [roomId]
        )

        if (activityResult.rows.length > 0) {
          const activityId = activityResult.rows[0].activity_id

          // Get all participants of the activity
          const participantsResult = await db.query(
            `SELECT DISTINCT user_id FROM activity_participants WHERE activity_id = $1
             UNION
             SELECT creator_id FROM activities WHERE id = $1`,
            [activityId]
          )

          const participantIds = participantsResult.rows.map(row => row.user_id || row.creator_id)

          // Send notifications to all participants (except sender)
          await notificationService.notifyNewMessage(
            activityId,
            participantIds,
            message.senderName,
            userId
          )
        }
      } catch (error) {
        console.error('Error handling send_message:', error)
        const errorPayload: ErrorPayload = {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send message',
        }
        socket.emit('error', errorPayload)
      }
    })

    /**
     * Handle disconnect event
     */
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected (socket ${socket.id})`)
    })
  })
}
