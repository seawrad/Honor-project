import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../middleware/error.middleware.js'
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter.middleware.js'

const router = Router()

// Public routes with rate limiting
router.post('/register', registerLimiter, asyncHandler((req, res) => authController.register(req, res)))
router.post('/login', loginLimiter, asyncHandler((req, res) => authController.login(req, res)))
router.post('/refresh-token', asyncHandler((req, res) => authController.refreshToken(req, res)))

// Protected routes
router.get('/me', authenticateToken, asyncHandler((req, res) => authController.me(req, res)))

export default router
