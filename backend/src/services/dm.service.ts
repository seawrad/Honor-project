import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'

export interface DMFriend {
  id: string
  displayName: string
  avatarUrl?: string | null
}

export interface DMRoom {
  id: string
  otherUser: DMFriend
  lastMessage?: string
  lastMessageAt?: string
  createdAt: string
}

export interface DMMessage {
  id: string
  dmRoomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
}

class DMService {
  /**
   * Get or create DM room between two users (must be friends / mutual follow)
   */
  async getOrCreateDMRoom(userId: string, otherUserId: string): Promise<DMRoom> {
    if (userId === otherUserId) {
      throw new ValidationError('Cannot message yourself', 'VALIDATION_INVALID_OPERATION')
    }

    // Check mutual follow
    const mutualResult = await db.query(
      `SELECT 1 FROM social_connections sc1
       JOIN social_connections sc2 ON sc2.follower_id = sc1.following_id AND sc2.following_id = sc1.follower_id
       WHERE sc1.follower_id = $1 AND sc1.following_id = $2`,
      [userId, otherUserId]
    )
    if (mutualResult.rows.length === 0) {
      throw new ValidationError('Can only message friends (mutual follow)', 'AUTH_FORBIDDEN')
    }

    const u1 = userId < otherUserId ? userId : otherUserId
    const u2 = userId < otherUserId ? otherUserId : userId

    let result = await db.query(
      'SELECT id, user1_id, user2_id, created_at FROM dm_chat_rooms WHERE user1_id = $1 AND user2_id = $2',
      [u1, u2]
    )

    if (result.rows.length === 0) {
      result = await db.query(
        `INSERT INTO dm_chat_rooms (user1_id, user2_id) VALUES ($1, $2)
         RETURNING id, user1_id, user2_id, created_at`,
        [u1, u2]
      )
    }

    const room = result.rows[0]
    const otherId = room.user1_id === userId ? room.user2_id : room.user1_id
    const otherResult = await db.query(
      'SELECT id, display_name, avatar_url FROM users WHERE id = $1',
      [otherId]
    )

    const lastMsgResult = await db.query(
      `SELECT content, created_at FROM dm_chat_messages
       WHERE dm_room_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [room.id]
    )

    return {
      id: room.id,
      otherUser: {
        id: otherResult.rows[0].id,
        displayName: otherResult.rows[0].display_name,
        avatarUrl: otherResult.rows[0].avatar_url || null,
      },
      lastMessage: lastMsgResult.rows[0]?.content,
      lastMessageAt: lastMsgResult.rows[0]?.created_at?.toISOString(),
      createdAt: room.created_at.toISOString(),
    }
  }

  /**
   * Get user's DM rooms
   */
  async getDMRooms(userId: string): Promise<DMRoom[]> {
    const result = await db.query(
      `SELECT r.id, r.user1_id, r.user2_id, r.created_at,
              u.id as other_id, u.display_name as other_name, u.avatar_url as other_avatar,
              (SELECT content FROM dm_chat_messages WHERE dm_room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_content,
              (SELECT created_at FROM dm_chat_messages WHERE dm_room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_at
       FROM dm_chat_rooms r
       JOIN users u ON u.id = CASE WHEN r.user1_id = $1 THEN r.user2_id ELSE r.user1_id END
       WHERE r.user1_id = $1 OR r.user2_id = $1
       ORDER BY COALESCE(last_at, r.created_at) DESC`,
      [userId]
    )

    return result.rows.map(row => ({
      id: row.id,
      otherUser: { id: row.other_id, displayName: row.other_name, avatarUrl: row.other_avatar ?? null },
      lastMessage: row.last_content,
      lastMessageAt: row.last_at?.toISOString(),
      createdAt: row.created_at.toISOString(),
    }))
  }

  /**
   * Check if user has access to DM room
   */
  async checkDMRoomAccess(roomId: string, userId: string): Promise<boolean> {
    const result = await db.query(
      'SELECT 1 FROM dm_chat_rooms WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
      [roomId, userId]
    )
    return result.rows.length > 0
  }

  /**
   * Get DM messages
   */
  async getMessages(
    roomId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: DMMessage[]; total: number }> {
    const hasAccess = await this.checkDMRoomAccess(roomId, userId)
    if (!hasAccess) {
      throw new ValidationError('Access denied', 'AUTH_FORBIDDEN')
    }

    const offset = (page - 1) * limit
    const result = await db.query(
      `SELECT m.id, m.dm_room_id, m.sender_id, m.content, m.created_at, u.display_name as sender_name
       FROM dm_chat_messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.dm_room_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomId, limit, offset]
    )

    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM dm_chat_messages WHERE dm_room_id = $1',
      [roomId]
    )

    const messages: DMMessage[] = result.rows.map(row => ({
      id: row.id,
      dmRoomId: row.dm_room_id,
      senderId: row.sender_id,
      senderName: row.sender_name,
      content: row.content,
      timestamp: row.created_at.toISOString(),
    })).reverse()

    return {
      messages,
      total: parseInt(countResult.rows[0].count),
    }
  }

  /**
   * Save DM message
   */
  async saveMessage(
    roomId: string,
    senderId: string,
    content: string
  ): Promise<DMMessage> {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content is required', 'VALIDATION_REQUIRED_FIELD')
    }
    if (content.length > 1000) {
      throw new ValidationError('Message too long', 'VALIDATION_INVALID_FORMAT')
    }

    const hasAccess = await this.checkDMRoomAccess(roomId, senderId)
    if (!hasAccess) {
      throw new ValidationError('Access denied', 'AUTH_FORBIDDEN')
    }

    const result = await db.query(
      `INSERT INTO dm_chat_messages (dm_room_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, dm_room_id, sender_id, content, created_at`,
      [roomId, senderId, content.trim()]
    )

    const row = result.rows[0]
    const senderResult = await db.query(
      'SELECT display_name FROM users WHERE id = $1',
      [senderId]
    )

    return {
      id: row.id,
      dmRoomId: row.dm_room_id,
      senderId: row.sender_id,
      senderName: senderResult.rows[0].display_name,
      content: row.content,
      timestamp: row.created_at.toISOString(),
    }
  }
}

export const dmService = new DMService()
