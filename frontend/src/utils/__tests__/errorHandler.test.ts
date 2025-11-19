import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorHandler } from '../errorHandler'

describe('ErrorHandler', () => {
  let mockToast: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockToast = vi.fn()
    ErrorHandler.setToastCallback(mockToast)
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    global.localStorage = localStorageMock as any
  })

  describe('handleApiError', () => {
    it('should handle authentication errors', () => {
      const error = {
        response: {
          data: {
            success: false,
            error: {
              code: 'AUTH_INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          },
        },
      }

      ErrorHandler.handleApiError(error)

      expect(mockToast).toHaveBeenCalledWith('電子郵件或密碼錯誤', 'error')
    })

    it('should handle validation errors', () => {
      const error = {
        response: {
          data: {
            success: false,
            error: {
              code: 'VALIDATION_AGE_RESTRICTION',
              message: 'Age must be between 18 and 65',
            },
          },
        },
      }

      ErrorHandler.handleApiError(error)

      expect(mockToast).toHaveBeenCalledWith('年齡必須在 18 到 65 歲之間', 'error')
    })

    it('should handle activity full error', () => {
      const error = {
        response: {
          data: {
            success: false,
            error: {
              code: 'ACTIVITY_FULL',
              message: 'Activity has reached maximum capacity',
            },
          },
        },
      }

      ErrorHandler.handleApiError(error)

      expect(mockToast).toHaveBeenCalledWith('此活動已滿額', 'warning')
    })

    it('should handle network errors', () => {
      const error = {
        request: {},
      }

      ErrorHandler.handleApiError(error)

      expect(mockToast).toHaveBeenCalledWith('網路連線錯誤，請檢查您的網路連線', 'error')
    })

    it('should handle unknown errors', () => {
      const error = {
        message: 'Unknown error',
      }

      ErrorHandler.handleApiError(error)

      expect(mockToast).toHaveBeenCalledWith('Unknown error', 'error')
    })

    it('should redirect to login on token expiration', () => {
      vi.useFakeTimers()
      const mockLocation = { href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      })

      const error = {
        response: {
          data: {
            success: false,
            error: {
              code: 'AUTH_TOKEN_EXPIRED',
              message: 'Token expired',
            },
          },
        },
      }

      ErrorHandler.handleApiError(error)

      expect(mockToast).toHaveBeenCalledWith('登入已過期，請重新登入', 'warning')
      expect(localStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(localStorage.removeItem).toHaveBeenCalledWith('user')

      vi.advanceTimersByTime(1500)
      expect(mockLocation.href).toBe('/login')

      vi.useRealTimers()
    })
  })

  describe('getFieldError', () => {
    it('should return field error message', () => {
      const error = {
        response: {
          data: {
            error: {
              details: {
                field: 'email',
              },
              message: 'Invalid email format',
            },
          },
        },
      }

      const fieldError = ErrorHandler.getFieldError(error, 'email')

      expect(fieldError).toBe('Invalid email format')
    })

    it('should return undefined for non-matching field', () => {
      const error = {
        response: {
          data: {
            error: {
              details: {
                field: 'email',
              },
              message: 'Invalid email format',
            },
          },
        },
      }

      const fieldError = ErrorHandler.getFieldError(error, 'password')

      expect(fieldError).toBeUndefined()
    })
  })
})
