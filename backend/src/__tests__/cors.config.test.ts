import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import cors from 'cors'
import { corsOptions, getAllowedOrigins } from '../config/cors.config.js'

describe('CORS Configuration', () => {
  let app: Express

  beforeEach(() => {
    app = express()
    app.use(cors(corsOptions))
    app.get('/test', (_req, res) => {
      res.json({ success: true })
    })
  })

  describe('Allowed Origins', () => {
    it('should allow requests from localhost:3000', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should allow requests from Vite dev server (localhost:5173)', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    })

    it('should allow requests from Vite preview server (localhost:4173)', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:4173')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:4173')
    })

    it('should allow requests with no origin', async () => {
      const response = await request(app).get('/test')

      expect(response.status).toBe(200)
    })
  })

  describe('Blocked Origins', () => {
    it('should block requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://malicious-site.com')

      // CORS error is handled by the browser, but server should not set CORS headers
      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('Preflight Requests', () => {
    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')

      expect(response.status).toBe(200)
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
      expect(response.headers['access-control-allow-methods']).toContain('POST')
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type')
      expect(response.headers['access-control-allow-headers']).toContain('Authorization')
    })

    it('should expose rate limit headers', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')

      expect(response.headers['access-control-expose-headers']).toContain('RateLimit-Limit')
      expect(response.headers['access-control-expose-headers']).toContain('RateLimit-Remaining')
      expect(response.headers['access-control-expose-headers']).toContain('RateLimit-Reset')
    })

    it('should cache preflight requests for 24 hours', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')

      expect(response.headers['access-control-max-age']).toBe('86400')
    })
  })

  describe('Credentials', () => {
    it('should allow credentials', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000')

      expect(response.headers['access-control-allow-credentials']).toBe('true')
    })
  })

  describe('getAllowedOrigins', () => {
    it('should return list of allowed origins', () => {
      const origins = getAllowedOrigins()
      
      expect(origins).toBeInstanceOf(Array)
      expect(origins.length).toBeGreaterThan(0)
      expect(origins).toContain('http://localhost:5173')
      expect(origins).toContain('http://localhost:4173')
    })
  })
})
