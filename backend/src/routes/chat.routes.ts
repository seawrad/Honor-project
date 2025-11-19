import { Router } from 'express'
import { chatController } from '../controllers/chat.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { chatLimiter } from '../middleware/rateLimiter.middleware.js'

const router = Router()

// All chat routes require authentication
router.use(authenticateToken)

// Apply chat-specific rate limiting
router.use(chatLimiter)

// Get chat room by activity ID
router.get('/rooms/:activityId', (req, res) => chatController.getChatRoomByActivityId(req, res))

// Get chat messages for a room
router.get('/rooms/:roomId/messages', (req, res) => chatController.getChatMessages(req, res))

export default router
