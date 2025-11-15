import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'
import { ChatRoom, ChatMessage } from '../types/chat.types.js'

class ChatService {
  /**
   * Get chat room by activity ID
   */
  async getChatRoomByActivityId(activityId: string): Promise<ChatRoom | null> {
    try {
      const result = await db.query(
        'SELECT id, activity_id, created_at FROM chat_rooms WHERE activity_id = $1',
        [activityId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const room = result.rows[0]
      return {
        id: room.id,
        activityId: room.activity_id,
        createdAt: room.created_at.toISOString(),
      }
    } catch (error) {
      console.error('Error fetching chat room:', error)
      throw new Error('Failed to fetch chat room')
    }
  }

  /**
   * Get chat room by ID
   */
  async getChatRoomById(roomId: string): Promise<ChatRoom | null> {
    try {
      const result = await db.query(
        'SELECT id, activity_id, created_at FROM chat_rooms WHERE id = $1',
        [roomId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const room = result.rows[0]
      return {
        id: room.id,
        activityId: room.activity_id,
        createdAt: room.created_at.toISOString(),
      }
    } catch (error) {
      console.error('Error fetching chat room:', error)
      throw new Error('Failed to fetch chat room')
    }
  }

  /**
   * Check if user has access to chat room
   * User has access if they are the activity creator or a participant
   */
  async checkRoomAccess(roomId: string, userId: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT EXISTS (
          SELECT 1 FROM chat_rooms cr
          JOIN activities a ON cr.activity_id = a.id
          WHERE cr.id = $1 AND (
            a.creator_id = $2 OR
            EXISTS (
              SELECT 1 FROM activity_participants ap
              WHERE ap.activity_id = a.id AND ap.user_id = $2
            )
          )
        ) as has_access`,
        [roomId, userId]
      )

      return result.rows[0].has_access
    } catch (error) {
      console.error('Error checking room access:', error)
      return false
    }
  }

  /**
   * Save a chat message
   */
  async saveMessage(
    roomId: string,
    senderId: string,
    content: string
  ): Promise<ChatMessage> {
    try {
      // Validate content
      if (!content || content.trim().length === 0) {
        throw new ValidationError('Message content is required', 'VALIDATION_REQUIRED_FIELD')
      }

      if (content.length > 1000) {
        throw new ValidationError(
          'Message content must be less than 1000 characters',
          'VALIDATION_INVALID_FORMAT'
        )
      }

      // Insert message
      const result = await db.query(
        `INSERT INTO chat_messages (chat_room_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, chat_room_id, sender_id, content, created_at`,
        [roomId, senderId, content.trim()]
      )

      const message = result.rows[0]

      // Get sender name
      const senderResult = await db.query(
        'SELECT display_name FROM users WHERE id = $1',
        [senderId]
      )

      return {
        id: message.id,
        chatRoomId: message.chat_room_id,
        senderId: message.sender_id,
        senderName: senderResult.rows[0].display_name,
        content: message.content,
        timestamp: message.created_at.toISOString(),
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error saving message:', error)
      throw new Error('Failed to save message')
    }
  }

  /**
   * Get chat messages for a room with pagination
   */
  async getMessages(
    roomId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    try {
      const offset = (page - 1) * limit

      // Get messages
      const result = await db.query(
        `SELECT cm.id, cm.chat_room_id, cm.sender_id, cm.content, cm.created_at,
                u.display_name as sender_name
         FROM chat_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.chat_room_id = $1
         AND cm.created_at >= NOW() - INTERVAL '7 days'
         ORDER BY cm.created_at DESC
         LIMIT $2 OFFSET $3`,
        [roomId, limit, offset]
      )

      // Get total count
      const countResult = await db.query(
        `SELECT COUNT(*) as count
         FROM chat_messages
         WHERE chat_room_id = $1
         AND created_at >= NOW() - INTERVAL '7 days'`,
        [roomId]
      )

      const messages: ChatMessage[] = result.rows.map(row => ({
        id: row.id,
        chatRoomId: row.chat_room_id,
        senderId: row.sender_id,
        senderName: row.sender_name,
        content: row.content,
        timestamp: row.created_at.toISOString(),
      }))

      return {
        messages: messages.reverse(), // Return in chronological order
        total: parseInt(countResult.rows[0].count),
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw new Error('Failed to fetch messages')
    }
  }

  /**
   * Delete messages older than 7 days
   */
  async cleanupOldMessages(): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM chat_messages
         WHERE created_at < NOW() - INTERVAL '7 days'`
      )

      return result.rowCount || 0
    } catch (error) {
      console.error('Error cleaning up old messages:', error)
      throw new Error('Failed to cleanup old messages')
    }
  }
}

export const chatService = new ChatService()
