import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { errorHandler, asyncHandler, notFoundHandler } from '../middleware/error.middleware'
import { Errors, AppError } from '../utils/errors'

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockRequest = {
      path: '/test',
      method: 'GET',
      body: {},
      query: {},
      params: {},
    }

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }

    mockNext = vi.fn()
  })

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = Errors.userNotFound()

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        })
      )
    })

    it('should handle validation errors', () => {
      const error = Errors.ageRestriction()

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'VALIDATION_AGE_RESTRICTION',
            message: 'Age must be between 18 and 65',
          },
        })
      )
    })

    it('should handle authentication errors', () => {
      const error = Errors.unauthorized()

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: 'User not authorized for this resource',
          },
        })
      )
    })

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error')

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
          }),
        })
      )
    })
  })

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const handler = asyncHandler(async (req, res) => {
        res.status(200).json({ success: true })
      })

      await handler(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should catch and forward errors to next', async () => {
      const error = new Error('Async error')
      const handler = asyncHandler(async () => {
        throw error
      })

      await handler(mockRequest as Request, mockResponse as Response, mockNext)

      expect(mockNext).toHaveBeenCalledWith(error)
    })
  })

  describe('notFoundHandler', () => {
    it('should return 404 for unknown routes', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: {
            code: 'ROUTE_NOT_FOUND',
            message: expect.stringContaining('not found'),
          },
        })
      )
    })
  })
})
