import { Router } from 'express'
import { GoalController } from '../controllers/goal.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/', authenticateToken, GoalController.getMyGoals)
router.post('/weekly', authenticateToken, GoalController.setWeeklyGoal)
router.post('/monthly', authenticateToken, GoalController.setMonthlyGoal)

export default router
