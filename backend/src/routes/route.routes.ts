import { Router } from 'express'
import { RouteController } from '../controllers/route.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// Create a new route (requires authentication)
router.post('/', authenticateToken, RouteController.createRoute)

// Add GPS positions to a route (requires authentication)
router.post('/:id/positions', authenticateToken, RouteController.addPositions)

// Get route by ID
router.get('/:id', RouteController.getRoute)

// Get route metrics
router.get('/:id/metrics', RouteController.getRouteMetrics)

// Get user's route history
router.get('/user/:userId', RouteController.getUserRoutes)

export default router
