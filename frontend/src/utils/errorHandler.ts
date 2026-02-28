// Centralized error handling utility for frontend

import { tokenStorage } from './tokenStorage'
import { frontendMonitoring } from './monitoring'

export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
  timestamp: string
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Error handler class
export class ErrorHandler {
  private static toastCallback: ((message: string, severity: 'error' | 'warning' | 'info') => void) | null = null

  // Set toast notification callback
  static setToastCallback(callback: (message: string, severity: 'error' | 'warning' | 'info') => void): void {
    this.toastCallback = callback
  }

  // Show toast notification
  private static showToast(message: string, severity: 'error' | 'warning' | 'info' = 'error'): void {
    if (this.toastCallback) {
      this.toastCallback(message, severity)
    } else {
      console.error('Toast callback not set:', message)
    }
  }

  // Handle API errors
  static handleApiError(error: any): void {
    if (error.response) {
      // API error response
      const apiError = error.response.data as ApiErrorResponse

      if (apiError.error) {
        const { code, message } = apiError.error

        switch (code) {
          case 'AUTH_TOKEN_EXPIRED':
            this.showToast('登入已過期，請重新登入', 'warning')
            this.redirectToLogin()
            break

          case 'AUTH_UNAUTHORIZED':
            this.showToast('未授權訪問，請先登入', 'warning')
            this.redirectToLogin()
            break

          case 'AUTH_INVALID_CREDENTIALS':
            this.showToast('電子郵件或密碼錯誤', 'error')
            break

          case 'VALIDATION_AGE_RESTRICTION':
            this.showToast('年齡必須在 18 到 65 歲之間', 'error')
            break

          case 'VALIDATION_DUPLICATE_EMAIL':
            this.showToast('此電子郵件已被註冊', 'error')
            break

          case 'ACTIVITY_FULL':
            this.showToast('此活動已滿額', 'warning')
            break

          case 'ACTIVITY_PAST_EDIT_DEADLINE':
            this.showToast('活動開始前 1 小時內無法編輯', 'warning')
            break

          case 'ALREADY_JOINED':
            this.showToast('您已經加入此活動', 'info')
            break

          case 'NOT_PARTICIPANT':
            this.showToast('您不是此活動的參與者', 'warning')
            break

          case 'USER_NOT_FOUND':
            this.showToast('找不到使用者', 'error')
            break

          case 'ACTIVITY_NOT_FOUND':
            this.showToast('找不到活動', 'error')
            break

          case 'RESOURCE_NOT_FOUND':
            this.showToast('找不到資源', 'error')
            break

          case 'DATABASE_ERROR':
            this.showToast('資料庫錯誤，請稍後再試', 'error')
            break

          case 'EXTERNAL_SERVICE_ERROR':
            this.showToast('外部服務暫時無法使用', 'error')
            break

          default:
            this.showToast(message || '發生錯誤，請稍後再試', 'error')
        }
      } else {
        this.showToast('伺服器回應錯誤', 'error')
      }
    } else if (error.request) {
      // Network error
      this.showToast('網路連線錯誤，請檢查您的網路連線', 'error')
    } else {
      // Client-side error
      this.showToast(error.message || '發生未預期的錯誤', 'error')
    }

    // Log error for debugging
    this.logError(error)
  }

  // Redirect to login page
  private static redirectToLogin(): void {
    // Clear auth data using tokenStorage for consistency
    tokenStorage.clearAll()

    // Redirect after a short delay
    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }

  // Log error to console and monitoring service
  private static logError(error: any): void {
    console.error('Error:', error)

    // Send to monitoring service
    try {
      frontendMonitoring.captureException(error)
    } catch (e) {
      console.error('Failed to log error to monitoring service:', e)
    }
  }

  // Handle form validation errors
  static getFieldError(error: any, fieldName: string): string | undefined {
    if (error.response?.data?.error?.details?.field === fieldName) {
      return error.response.data.error.message
    }
    return undefined
  }
}

// Export user-friendly error messages
export const ErrorMessages = {
  NETWORK_ERROR: '網路連線錯誤，請檢查您的網路連線',
  UNKNOWN_ERROR: '發生未預期的錯誤，請稍後再試',
  SESSION_EXPIRED: '登入已過期，請重新登入',
  UNAUTHORIZED: '未授權訪問，請先登入',
  VALIDATION_ERROR: '輸入資料有誤，請檢查後重試',
  SERVER_ERROR: '伺服器錯誤，請稍後再試',
}
