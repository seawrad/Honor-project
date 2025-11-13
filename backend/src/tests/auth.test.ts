import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { authService } from '../services/auth.service.js'
import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'

describe('Authentication Service', () => {
  beforeAll(async () => {
    // Ensure database connection
    await db.testConnection()
  })

  afterAll(async () => {
    // Clean up and close database connection
    await db.close()
  })

  beforeEach(async () => {
    // Clean up test users before each test
    try {
      await db.query("DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%'")
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  describe('User Registration', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        age: 25,
        agreedToTerms: true,
      }

      const user = await authService.register(userData)

      expect(user).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.displayName).toBe('Test User')
      expect(user.age).toBe(25)
      expect(user.id).toBeDefined()
    })

    it('should reject registration with age below 18', async () => {
      const userData = {
        email: 'young@example.com',
        password: 'password123',
        displayName: 'Young User',
        age: 17,
        agreedToTerms: true,
      }

      await expect(authService.register(userData)).rejects.toThrow(ValidationError)
      await expect(authService.register(userData)).rejects.toThrow('Age must be between 18 and 65 years')
    })

    it('should reject registration with age above 65', async () => {
      const userData = {
        email: 'old@example.com',
        password: 'password123',
        displayName: 'Old User',
        age: 66,
        agreedToTerms: true,
      }

      await expect(authService.register(userData)).rejects.toThrow(ValidationError)
      await expect(authService.register(userData)).rejects.toThrow('Age must be between 18 and 65 years')
    })

    it('should reject registration with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        displayName: 'Test User',
        age: 25,
        agreedToTerms: true,
      }

      await expect(authService.register(userData)).rejects.toThrow(ValidationError)
      await expect(authService.register(userData)).rejects.toThrow('Invalid email format')
    })

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        displayName: 'Test User',
        age: 25,
        agreedToTerms: true,
      }

      // Register first user
      await authService.register(userData)

      // Try to register with same email
      await expect(authService.register(userData)).rejects.toThrow(ValidationError)
      await expect(authService.register(userData)).rejects.toThrow('Email already registered')
    })

    it('should reject registration without agreeing to terms', async () => {
      const userData = {
        email: 'noterms@example.com',
        password: 'password123',
        displayName: 'Test User',
        age: 25,
        agreedToTerms: false,
      }

      await expect(authService.register(userData)).rejects.toThrow(ValidationError)
      await expect(authService.register(userData)).rejects.toThrow('You must agree to the terms of service')
    })

    it('should reject registration with short password', async () => {
      const userData = {
        email: 'short@example.com',
        password: 'pass',
        displayName: 'Test User',
        age: 25,
        agreedToTerms: true,
      }

      await expect(authService.register(userData)).rejects.toThrow(ValidationError)
      await expect(authService.register(userData)).rejects.toThrow('Password must be at least 8 characters long')
    })
  })

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await authService.register({
        email: 'login@example.com',
        password: 'password123',
        displayName: 'Login User',
        age: 30,
        agreedToTerms: true,
      })
    })

    it('should login with correct credentials', async () => {
      const result = await authService.login('login@example.com', 'password123')

      expect(result).toBeDefined()
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('login@example.com')
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })

    it('should reject login with incorrect password', async () => {
      await expect(authService.login('login@example.com', 'wrongpassword')).rejects.toThrow(ValidationError)
      await expect(authService.login('login@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password')
    })

    it('should reject login with non-existent email', async () => {
      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow(ValidationError)
      await expect(authService.login('nonexistent@example.com', 'password123')).rejects.toThrow('Invalid email or password')
    })
  })

  describe('JWT Token Generation and Verification', () => {
    it('should generate valid access token', () => {
      const userId = 'test-user-id'
      const token = authService.generateAccessToken(userId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      const decoded = authService.verifyAccessToken(token)
      expect(decoded.userId).toBe(userId)
    })

    it('should generate valid refresh token', () => {
      const userId = 'test-user-id'
      const token = authService.generateRefreshToken(userId)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      const decoded = authService.verifyRefreshToken(token)
      expect(decoded.userId).toBe(userId)
    })

    it('should reject invalid access token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => authService.verifyAccessToken(invalidToken)).toThrow(ValidationError)
      expect(() => authService.verifyAccessToken(invalidToken)).toThrow('Invalid token')
    })

    it('should reject invalid refresh token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => authService.verifyRefreshToken(invalidToken)).toThrow(ValidationError)
      expect(() => authService.verifyRefreshToken(invalidToken)).toThrow('Invalid refresh token')
    })
  })
})
