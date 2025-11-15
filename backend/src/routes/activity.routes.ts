import { Router } from 'express'
import { activityController } from '../controllers/activity.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// All activity routes require authentication
router.use(authenticateToken)

// Activity CRUD operations
router.post('/', activityController.createActivity.bind(activityController))
router.get('/', activityController.searchActivities.bind(activityController))
router.get('/:id', activityController.getActivity.bind(activityController))
router.put('/:id', activityController.updateActivity.bind(activityController))
router.delete('/:id', activityController.cancelActivity.bind(activityController))

// Activity participation
router.post('/:id/join', activityController.joinActivity.bind(activityController))
router.delete('/:id/leave', activityController.leaveActivity.bind(activityController))

// Activity ratings
router.post('/:id/ratings', activityController.createRating.bind(activityController))
router.get('/:id/ratings', activityController.getActivityRatings.bind(activityController))

export default router
