import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { authService } from '../services/auth.service.js'
import { AuthenticatedSocket } from '../types/socket.types.js'

/**
 * Socket.io authentication middleware
 * Verifies JWT token from handshake auth or query
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: ExtendedError) => void
): void {
  try {
    // Get token from handshake auth or query
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token

    if (!token || typeof token !== 'string') {
      const error = new Error('Authentication token required') as ExtendedError
      error.data = { code: 'AUTH_UNAUTHORIZED' }
      return next(error)
    }

    // Verify token
    const { userId } = authService.verifyAccessToken(token)

    // Attach userId to socket
    ;(socket as AuthenticatedSocket).userId = userId

    next()
  } catch (error) {
    const authError = new Error('Invalid or expired token') as ExtendedError
    authError.data = { code: 'AUTH_TOKEN_INVALID' }
    next(authError)
  }
}
