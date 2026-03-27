import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { db } from './database/db.js'
import { runMigrations } from './database/migrate.js'
import { socketAuthMiddleware } from './middleware/socket.middleware.js'
import { setupChatHandlers } from './socket/chat.handler.js'
import { setupActivityTrackingHandlers } from './socket/activityTracking.handler.js'
import { monitoring } from './utils/monitoring.js'
import { cloudwatch } from './utils/cloudwatch.js'
import { corsOptions, socketCorsOptions } from './config/cors.config.js'
import { seedDatabase } from './database/seed.js'
import swaggerUi from 'swagger-ui-express'
import { openApiSpec } from './swagger.js'

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

// Railway/Render sit behind a reverse proxy and set X-Forwarded-* headers.
// express-rate-limit expects trust proxy to be enabled in that setup.
app.set('trust proxy', 1)

// Apply Socket.io authentication middleware
io.use(socketAuthMiddleware)

// Setup chat event handlers
setupChatHandlers(io)
setupActivityTrackingHandlers(io)

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/error.middleware.js'
import { apiLimiter } from './middleware/rateLimiter.middleware.js'

// Middleware
app.use(helmet({ contentSecurityPolicy: false })) // CSP disabled for API; enable if serving HTML
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

// API documentation (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec))

// Import routes
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import activityRoutes from './routes/activity.routes.js'
import routeRoutes from './routes/route.routes.js'
import memoryCardRoutes from './routes/memoryCard.routes.js'
import achievementRoutes from './routes/achievement.routes.js'
import goalRoutes from './routes/goal.routes.js'
import leaderboardRoutes from './routes/leaderboard.routes.js'
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

// Memory card routes
app.use('/api/memory-cards', memoryCardRoutes)

// Achievement routes
app.use('/api/achievements', achievementRoutes)

// Goal routes
app.use('/api/goals', goalRoutes)

// Leaderboard routes (public)
app.use('/api/leaderboard', leaderboardRoutes)

// Chat routes
app.use('/api/chat', chatRoutes)

// Notification routes
app.use('/api/notifications', notificationRoutes)

// Serve frontend static files in production (when public folder exists)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicPath = path.join(path.dirname(__dirname), 'public')
if (existsSync(publicPath)) {
  app.use(express.static(publicPath))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(publicPath, 'index.html'))
  })
}

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

    // Run pending migrations before starting (set SKIP_AUTO_MIGRATE=1 to disable)
    if (process.env.SKIP_AUTO_MIGRATE !== '1') {
      await runMigrations()
    }

    // Optional: run seed on startup for Railway/demo environment
    if (process.env.SEED_ON_START === '1') {
      console.log('SEED_ON_START=1 -> running seedDatabase()...')
      await seedDatabase()
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
