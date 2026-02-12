import { Router } from 'express'
import { chatController } from '../controllers/chat.controller.js'
import { dmController } from '../controllers/dm.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { chatLimiter } from '../middleware/rateLimiter.middleware.js'

const router = Router()

// All chat routes require authentication
router.use(authenticateToken)

// Apply chat-specific rate limiting
router.use(chatLimiter)

// Activity chat: Get chat room by activity ID
router.get('/rooms/:activityId', (req, res) => chatController.getChatRoomByActivityId(req, res))

// Activity chat: Get chat messages for a room
router.get('/rooms/:roomId/messages', (req, res) => chatController.getChatMessages(req, res))

// DM chat: Get or create room with friend
router.post('/dm/rooms', (req, res) => dmController.getOrCreateRoom(req, res))

// DM chat: List user's DM rooms
router.get('/dm/rooms', (req, res) => dmController.getRooms(req, res))

// DM chat: Get messages
router.get('/dm/rooms/:roomId/messages', (req, res) => dmController.getMessages(req, res))

// DM chat: Send message (REST fallback; real-time via socket)
router.post('/dm/rooms/:roomId/messages', (req, res) => dmController.sendMessage(req, res))

export default router
