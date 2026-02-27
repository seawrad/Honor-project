import { Router } from 'express'
import { AchievementController } from '../controllers/achievement.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', authenticateToken, AchievementController.getMyAchievements)
router.get('/count', authenticateToken, AchievementController.getUnlockedCount)
router.post('/check', authenticateToken, AchievementController.checkAchievements)

export default router
