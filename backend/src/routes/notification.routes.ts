import { Router } from 'express'
import { notificationController } from '../controllers/notification.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// All notification routes require authentication
router.use(authenticateToken)

// Create notification (internal use, still protected by auth)
router.post('/', (req, res) => 
  notificationController.createNotification(req, res)
)

// Get user notifications
router.get('/', (req, res) => 
  notificationController.getUserNotifications(req, res)
)

// Mark all notifications as read (must be before /:id routes)
router.put('/read-all', (req, res) => 
  notificationController.markAllAsRead(req, res)
)

// Mark notification as read
router.put('/:id/read', (req, res) => 
  notificationController.markAsRead(req, res)
)

// Delete notification
router.delete('/:id', (req, res) => 
  notificationController.deleteNotification(req, res)
)

export default router
