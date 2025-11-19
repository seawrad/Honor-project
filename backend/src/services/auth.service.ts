import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../database/db.js'
import { RegisterRequest, User } from '../types/auth.types.js'
import {
  validateEmail,
  validateAge,
  validatePassword,
  validateRequiredFields,
} from '../utils/validation.js'
import { Errors } from '../utils/errors.js'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
const ACCESS_TOKEN_EXPIRY = '24h'
const REFRESH_TOKEN_EXPIRY = '7d'

export class AuthService {
  async register(data: RegisterRequest): Promise<User> {
    // Validate required fields
    validateRequiredFields(data, ['email', 'password', 'displayName', 'age', 'agreedToTerms'])

    // Validate email format
    validateEmail(data.email)

    // Validate age restriction
    validateAge(data.age)

    // Validate password
    validatePassword(data.password)

    // Check if terms are agreed
    if (!data.agreedToTerms) {
      throw Errors.requiredField('agreedToTerms')
    }

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email.toLowerCase()]
    )

    if (existingUser.rows.length > 0) {
      throw Errors.duplicateEmail()
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

    // Insert user into database
    const result = await db.query(
      `INSERT INTO users (email, password_hash, display_name, age, agreed_to_terms)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, display_name as "displayName", age, created_at as "createdAt", updated_at as "updatedAt"`,
      [data.email.toLowerCase(), passwordHash, data.displayName, data.age, data.agreedToTerms]
    )

    return result.rows[0]
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Validate required fields
    if (!email || !password) {
      throw Errors.requiredField('email and password')
    }

    // Find user by email
    const result = await db.query(
      `SELECT id, email, password_hash, display_name as "displayName", age, created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      throw Errors.invalidCredentials()
    }

    const user = result.rows[0]

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      throw Errors.invalidCredentials()
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id)
    const refreshToken = this.generateRefreshToken(user.id)

    // Remove password_hash from user object
    const { password_hash, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    }
  }

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY })
  }

  verifyAccessToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw Errors.tokenExpired()
      }
      throw Errors.tokenInvalid()
    }
  }

  verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw Errors.tokenExpired()
      }
      throw Errors.tokenInvalid()
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const result = await db.query(
      `SELECT id, email, display_name as "displayName", age, created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       WHERE id = $1`,
      [userId]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }
}

export const authService = new AuthService()
