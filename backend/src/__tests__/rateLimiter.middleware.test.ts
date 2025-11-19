import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express, { Express } from 'express'
import { loginLimiter, registerLimiter, apiLimiter, strictLimiter, chatLimiter } from '../middleware/rateLimiter.middleware.js'

describe('Rate Limiter Middleware', () => {
  let app: Express

  beforeEach(() => {
    app = express()
    app.use(express.json())
  })

  describe('loginLimiter', () => {
    it('should allow requests within the limit', async () => {
      app.post('/test-login', loginLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        const response = await request(app).post('/test-login')
        expect(response.status).toBe(200)
      }
    })

    it('should block requests exceeding the limit', async () => {
      app.post('/test-login', loginLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 5 requests (the limit)
      for (let i = 0; i < 5; i++) {
        await request(app).post('/test-login')
      }

      // 6th request should be rate limited
      const response = await request(app).post('/test-login')
      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(response.body.error.message).toContain('Too many login attempts')
    })

    it('should include rate limit headers', async () => {
      app.post('/test-login', loginLimiter, (_req, res) => {
        res.json({ success: true })
      })

      const response = await request(app).post('/test-login')
      expect(response.headers['ratelimit-limit']).toBeDefined()
      expect(response.headers['ratelimit-remaining']).toBeDefined()
      expect(response.headers['ratelimit-reset']).toBeDefined()
    })
  })

  describe('registerLimiter', () => {
    it('should allow requests within the limit', async () => {
      app.post('/test-register', registerLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 3 requests (the limit)
      for (let i = 0; i < 3; i++) {
        const response = await request(app).post('/test-register')
        expect(response.status).toBe(200)
      }
    })

    it('should block requests exceeding the limit', async () => {
      app.post('/test-register', registerLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 3 requests (the limit)
      for (let i = 0; i < 3; i++) {
        await request(app).post('/test-register')
      }

      // 4th request should be rate limited
      const response = await request(app).post('/test-register')
      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
      expect(response.body.error.message).toContain('Too many registration attempts')
    })
  })

  describe('apiLimiter', () => {
    it('should allow requests within the limit', async () => {
      app.get('/test-api', apiLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 10 requests (well within the 100 limit)
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/test-api')
        expect(response.status).toBe(200)
      }
    })

    it('should skip rate limiting for health check', async () => {
      app.get('/health', apiLimiter, (_req, res) => {
        res.json({ status: 'ok' })
      })

      // Make many requests to health check
      for (let i = 0; i < 10; i++) {
        const response = await request(app).get('/health')
        expect(response.status).toBe(200)
      }
    })
  })

  describe('strictLimiter', () => {
    it('should allow requests within the limit', async () => {
      app.delete('/test-strict', strictLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        const response = await request(app).delete('/test-strict')
        expect(response.status).toBe(200)
      }
    })

    it('should block requests exceeding the limit', async () => {
      app.delete('/test-strict', strictLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        await request(app).delete('/test-strict')
      }

      // 11th request should be rate limited
      const response = await request(app).delete('/test-strict')
      expect(response.status).toBe(429)
      expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })

  describe('chatLimiter', () => {
    it('should allow requests within the limit', async () => {
      app.post('/test-chat', chatLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 10 requests (well within the 60 limit)
      for (let i = 0; i < 10; i++) {
        const response = await request(app).post('/test-chat')
        expect(response.status).toBe(200)
      }
    })

    it('should have appropriate error message for chat', async () => {
      app.post('/test-chat', chatLimiter, (_req, res) => {
        res.json({ success: true })
      })

      // Make 60 requests (the limit)
      for (let i = 0; i < 60; i++) {
        await request(app).post('/test-chat')
      }

      // 61st request should be rate limited
      const response = await request(app).post('/test-chat')
      expect(response.status).toBe(429)
      expect(response.body.error.message).toContain('sending messages too quickly')
    })
  })
})
