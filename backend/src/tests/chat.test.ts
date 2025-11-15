import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { chatService } from '../services/chat.service.js'
import { activityService } from '../services/activity.service.js'
import { authService } from '../services/auth.service.js'
import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'
import { CreateActivityRequest } from '../types/activity.types.js'
import { Server } from 'socket.io'
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client'
import { createServer } from 'http'
import { setupChatHandlers } from '../socket/chat.handler.js'
import { socketAuthMiddleware } from '../middleware/socket.middleware.js'

describe('Chat Service', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testUser3Id: string
  let testActivityId: string
  let testChatRoomId: string

  beforeAll(async () => {
    // Ensure database connection
    await db.testConnection()
  })

  afterAll(async () => {
    // Clean up and close database connection
    await db.close()
  })

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await db.query("DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%'")
    } catch (error) {
      console.error('Cleanup error:', error)
    }

    // Create test users
    const user1 = await authService.register({
      email: 'user1@test.com',
      password: 'password123',
      displayName: 'Test User One',
      age: 25,
      agreedToTerms: true,
    })
    testUser1Id = user1.id

    const user2 = await authService.register({
      email: 'user2@test.com',
      password: 'password123',
      displayName: 'Test User Two',
      age: 30,
      agreedToTerms: true,
    })
    testUser2Id = user2.id

    const user3 = await authService.register({
      email: 'user3@test.com',
      password: 'password123',
      displayName: 'Test User Three',
      age: 35,
      agreedToTerms: true,
    })
    testUser3Id = user3.id

    // Create test activity (which automatically creates a chat room)
    const activityData: CreateActivityRequest = {
      title: 'Test Activity',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      latitude: 40.7128,
      longitude: -74.006,
      address: 'Central Park, New York',
      distance: 5.0,
      maxParticipants: 10,
    }
    const activity = await activityService.createActivity(testUser1Id, activityData)
    testActivityId = activity.id

    // Get the chat room ID
    const room = await chatService.getChatRoomByActivityId(testActivityId)
    testChatRoomId = room!.id
  })

  describe('Chat Room Retrieval', () => {
    it('should get chat room by activity ID', async () => {
      const room = await chatService.getChatRoomByActivityId(testActivityId)

      expect(room).toBeDefined()
      expect(room!.id).toBe(testChatRoomId)
      expect(room!.activityId).toBe(testActivityId)
      expect(room!.createdAt).toBeDefined()
    })

    it('should return null for non-existent activity', async () => {
      const fakeActivityId = '00000000-0000-0000-0000-000000000000'
      const room = await chatService.getChatRoomByActivityId(fakeActivityId)

      expect(room).toBeNull()
    })

    it('should get chat room by ID', async () => {
      const room = await chatService.getChatRoomById(testChatRoomId)

      expect(room).toBeDefined()
      expect(room!.id).toBe(testChatRoomId)
      expect(room!.activityId).toBe(testActivityId)
    })

    it('should return null for non-existent room ID', async () => {
      const fakeRoomId = '00000000-0000-0000-0000-000000000000'
      const room = await chatService.getChatRoomById(fakeRoomId)

      expect(room).toBeNull()
    })
  })

  describe('Room Access Control', () => {
    it('should grant access to activity creator', async () => {
      const hasAccess = await chatService.checkRoomAccess(testChatRoomId, testUser1Id)

      expect(hasAccess).toBe(true)
    })

    it('should grant access to activity participant', async () => {
      // Join the activity
      await activityService.joinActivity(testActivityId, testUser2Id)

      const hasAccess = await chatService.checkRoomAccess(testChatRoomId, testUser2Id)

      expect(hasAccess).toBe(true)
    })

    it('should deny access to non-participant', async () => {
      const hasAccess = await chatService.checkRoomAccess(testChatRoomId, testUser3Id)

      expect(hasAccess).toBe(false)
    })

    it('should deny access after leaving activity', async () => {
      // Join and then leave the activity
      await activityService.joinActivity(testActivityId, testUser2Id)
      await activityService.leaveActivity(testActivityId, testUser2Id)

      const hasAccess = await chatService.checkRoomAccess(testChatRoomId, testUser2Id)

      expect(hasAccess).toBe(false)
    })
  })

  describe('Message Sending', () => {
    it('should save a message', async () => {
      const message = await chatService.saveMessage(
        testChatRoomId,
        testUser1Id,
        'Hello, everyone!'
      )

      expect(message).toBeDefined()
      expect(message.id).toBeDefined()
      expect(message.chatRoomId).toBe(testChatRoomId)
      expect(message.senderId).toBe(testUser1Id)
      expect(message.senderName).toBe('Test User One')
      expect(message.content).toBe('Hello, everyone!')
      expect(message.timestamp).toBeDefined()
    })

    it('should trim message content', async () => {
      const message = await chatService.saveMessage(
        testChatRoomId,
        testUser1Id,
        '  Hello with spaces  '
      )

      expect(message.content).toBe('Hello with spaces')
    })

    it('should reject empty message', async () => {
      await expect(
        chatService.saveMessage(testChatRoomId, testUser1Id, '')
      ).rejects.toThrow(ValidationError)
      await expect(
        chatService.saveMessage(testChatRoomId, testUser1Id, '')
      ).rejects.toThrow('Message content is required')
    })

    it('should reject message with only whitespace', async () => {
      await expect(
        chatService.saveMessage(testChatRoomId, testUser1Id, '   ')
      ).rejects.toThrow(ValidationError)
      await expect(
        chatService.saveMessage(testChatRoomId, testUser1Id, '   ')
      ).rejects.toThrow('Message content is required')
    })

    it('should reject message exceeding 1000 characters', async () => {
      const longMessage = 'a'.repeat(1001)

      await expect(
        chatService.saveMessage(testChatRoomId, testUser1Id, longMessage)
      ).rejects.toThrow(ValidationError)
      await expect(
        chatService.saveMessage(testChatRoomId, testUser1Id, longMessage)
      ).rejects.toThrow('Message content must be less than 1000 characters')
    })
  })

  describe('Message History', () => {
    beforeEach(async () => {
      // Create some test messages
      await chatService.saveMessage(testChatRoomId, testUser1Id, 'First message')
      await chatService.saveMessage(testChatRoomId, testUser1Id, 'Second message')
      
      // Join activity and send message as user2
      await activityService.joinActivity(testActivityId, testUser2Id)
      await chatService.saveMessage(testChatRoomId, testUser2Id, 'Third message')
    })

    it('should retrieve message history', async () => {
      const { messages, total } = await chatService.getMessages(testChatRoomId)

      expect(total).toBe(3)
      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('First message')
      expect(messages[1].content).toBe('Second message')
      expect(messages[2].content).toBe('Third message')
    })

    it('should include sender names in messages', async () => {
      const { messages } = await chatService.getMessages(testChatRoomId)

      expect(messages[0].senderName).toBe('Test User One')
      expect(messages[2].senderName).toBe('Test User Two')
    })

    it('should paginate message history', async () => {
      const { messages, total } = await chatService.getMessages(testChatRoomId, 1, 2)

      expect(total).toBe(3)
      expect(messages).toHaveLength(2)
    })

    it('should return messages in chronological order', async () => {
      const { messages } = await chatService.getMessages(testChatRoomId)

      // Verify timestamps are in ascending order
      for (let i = 1; i < messages.length; i++) {
        const prevTime = new Date(messages[i - 1].timestamp).getTime()
        const currTime = new Date(messages[i].timestamp).getTime()
        expect(currTime).toBeGreaterThanOrEqual(prevTime)
      }
    })
  })

  describe('Message Retention', () => {
    it('should only return messages from last 7 days', async () => {
      // Create a message
      await chatService.saveMessage(testChatRoomId, testUser1Id, 'Recent message')

      // Manually insert an old message (8 days ago)
      await db.query(
        `INSERT INTO chat_messages (chat_room_id, sender_id, content, created_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '8 days')`,
        [testChatRoomId, testUser1Id, 'Old message']
      )

      const { messages, total } = await chatService.getMessages(testChatRoomId)

      // Should only return the recent message
      expect(total).toBe(1)
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('Recent message')
    })

    it('should cleanup old messages', async () => {
      // Insert old messages
      await db.query(
        `INSERT INTO chat_messages (chat_room_id, sender_id, content, created_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '8 days')`,
        [testChatRoomId, testUser1Id, 'Old message 1']
      )
      await db.query(
        `INSERT INTO chat_messages (chat_room_id, sender_id, content, created_at)
         VALUES ($1, $2, $3, NOW() - INTERVAL '10 days')`,
        [testChatRoomId, testUser1Id, 'Old message 2']
      )

      // Create a recent message
      await chatService.saveMessage(testChatRoomId, testUser1Id, 'Recent message')

      // Run cleanup
      const deletedCount = await chatService.cleanupOldMessages()

      expect(deletedCount).toBe(2)

      // Verify only recent message remains
      const allMessages = await db.query(
        'SELECT * FROM chat_messages WHERE chat_room_id = $1',
        [testChatRoomId]
      )
      expect(allMessages.rows).toHaveLength(1)
      expect(allMessages.rows[0].content).toBe('Recent message')
    })
  })
})
