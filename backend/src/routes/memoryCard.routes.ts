import { Router } from 'express'
import { MemoryCardController } from '../controllers/memoryCard.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

router.post('/', authenticateToken, MemoryCardController.create)
router.get('/activity/:activityId', MemoryCardController.getByActivityId)
router.get('/:id', MemoryCardController.getById)

export default router
