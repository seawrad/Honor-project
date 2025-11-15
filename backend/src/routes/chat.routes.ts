import { Router } from 'express'
import { chatController } from '../controllers/chat.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// All chat routes require authentication
router.use(authenticateToken)

// Get chat room by activity ID
router.get('/rooms/:activityId', (req, res) => chatController.getChatRoomByActivityId(req, res))

// Get chat messages for a room
router.get('/rooms/:roomId/messages', (req, res) => chatController.getChatMessages(req, res))

export default router
