import { CorsOptions } from 'cors'

/**
 * CORS configuration for the application
 * Allows only trusted origins and configures credentials handling
 */

function normalizeOrigin(value: string): string {
  // Browser `Origin` header never includes a trailing slash.
  // Normalize both env vars and incoming origin to avoid subtle mismatches.
  return value.trim().replace(/\/$/, '')
}

// List of allowed origins
const allowedOrigins = [
  normalizeOrigin(process.env.CORS_ORIGIN || 'http://localhost:3000'),
  'http://localhost:5173', // Vite dev server
  'http://localhost:4173', // Vite preview server
]

// Add production origins if specified
if (process.env.PRODUCTION_ORIGIN) {
  allowedOrigins.push(normalizeOrigin(process.env.PRODUCTION_ORIGIN))
}

// Add staging origins if specified
if (process.env.STAGING_ORIGIN) {
  allowedOrigins.push(normalizeOrigin(process.env.STAGING_ORIGIN))
}

/**
 * CORS options for Express
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true)
    }

    const normalizedOrigin = normalizeOrigin(origin)

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ], // Allowed request headers
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
  ], // Headers exposed to the client
  maxAge: 86400, // Cache preflight requests for 24 hours
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}

/**
 * CORS options for Socket.io
 */
export const socketCorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST'],
}

/**
 * Get the list of allowed origins
 */
export const getAllowedOrigins = (): string[] => {
  return [...allowedOrigins]
}
