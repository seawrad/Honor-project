import { Router } from 'express'
import { userController } from '../controllers/user.controller.js'
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js'

const router = Router()

// Search users (with optional auth to show follow status)
router.get('/search', optionalAuth, (req, res) => userController.searchUsers(req, res))

// Get user profile (public)
router.get('/:id', optionalAuth, (req, res) => userController.getUserProfile(req, res))

// Update user profile (requires auth)
router.put('/:id', authenticateToken, (req, res) => userController.updateProfile(req, res))

// Delete user account (requires auth)
router.delete('/:id', authenticateToken, (req, res) => userController.deleteAccount(req, res))

// Follow user (requires auth)
router.post('/:id/follow', authenticateToken, (req, res) => userController.followUser(req, res))

// Unfollow user (requires auth)
router.delete('/:id/follow', authenticateToken, (req, res) => userController.unfollowUser(req, res))

// Get user's followers
router.get('/:id/followers', (req, res) => userController.getFollowers(req, res))

// Get users that the user is following
router.get('/:id/following', (req, res) => userController.getFollowing(req, res))

export default router
