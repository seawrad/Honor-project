import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { db } from './database/db.js'
import { socketAuthMiddleware } from './middleware/socket.middleware.js'
import { setupChatHandlers } from './socket/chat.handler.js'

// Load environment variables
dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})

// Apply Socket.io authentication middleware
io.use(socketAuthMiddleware)

// Setup chat event handlers
setupChatHandlers(io)

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
    await db.close()
    process.exit(0)
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  httpServer.close(async () => {
    console.log('HTTP server closed')
    await db.close()
    process.exit(0)
  })
})

startServer()
