import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { db } from './database/db.js'
import { socketAuthMiddleware } from './middleware/socket.middleware.js'
import { setupChatHandlers } from './socket/chat.handler.js'
import { monitoring } from './utils/monitoring.js'
import { cloudwatch } from './utils/cloudwatch.js'
import { corsOptions, socketCorsOptions } from './config/cors.config.js'

// Load environment variables
dotenv.config()

// Initialize monitoring services
monitoring.init()
cloudwatch.init()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: socketCorsOptions,
})

// Apply Socket.io authentication middleware
io.use(socketAuthMiddleware)

// Setup chat event handlers
setupChatHandlers(io)

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/error.middleware.js'
import { apiLimiter } from './middleware/rateLimiter.middleware.js'

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' })) // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use(requestLogger)

// Apply rate limiting to all API routes
app.use('/api', apiLimiter)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Import routes
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import activityRoutes from './routes/activity.routes.js'
import routeRoutes from './routes/route.routes.js'
import chatRoutes from './routes/chat.routes.js'
import notificationRoutes from './routes/notification.routes.js'

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'Group Running App API' })
})

// Auth routes
app.use('/api/auth', authRoutes)

// User routes
app.use('/api/users', userRoutes)

// Activity routes
app.use('/api/activities', activityRoutes)

// Route routes
app.use('/api/routes', routeRoutes)

// Chat routes
app.use('/api/chat', chatRoutes)

// Notification routes
app.use('/api/notifications', notificationRoutes)

// 404 handler - must be after all routes
app.use(notFoundHandler)

// Error handling middleware - must be last
app.use(errorHandler)

// Export io instance for use in other modules
export { io }

// Start server
const PORT = process.env.PORT || 5000

// Initialize database connection and start server
async function startServer() {
  try {
    // Test database connection
    const isConnected = await db.testConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to database')
    }

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Database pool stats:`, db.getPoolStats())
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  httpServer.close(async () => {
    console.log('HTTP server closed')
    cloudwatch.shutdown()
    await db.close()
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  httpServer.close(async () => {
    console.log('HTTP server closed')
    cloudwatch.shutdown()
    await db.close()
    process.exit(0)
  })
})

startServer()
