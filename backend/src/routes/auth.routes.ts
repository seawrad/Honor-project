import { Router } from 'express'
import { authController } from '../controllers/auth.controller.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// Public routes
router.post('/register', (req, res) => authController.register(req, res))
router.post('/login', (req, res) => authController.login(req, res))
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res))

// Protected routes
router.get('/me', authenticateToken, (req, res) => authController.me(req, res))

export default router
