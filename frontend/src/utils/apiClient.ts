import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ErrorHandler } from './errorHandler'
import { tokenStorage } from './tokenStorage'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle token expiration and refresh
    if (error.response?.status === 401 && error.response?.data?.error?.code === 'AUTH_TOKEN_EXPIRED') {
      if (!originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshToken = tokenStorage.getRefreshToken()
          if (refreshToken) {
            const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
            const response = await axios.post(
              `${baseURL}/api/auth/refresh-token`,
              { refreshToken }
            )

            const { accessToken } = response.data.data
            tokenStorage.setAccessToken(accessToken, tokenStorage.isPersistent())

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          ErrorHandler.handleApiError(refreshError)
          return Promise.reject(refreshError)
        }
      }
    }

    // Handle other errors
    ErrorHandler.handleApiError(error)
    return Promise.reject(error)
  }
)

// Wrapper functions for common HTTP methods
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.get<T>(url, config)
  },

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post<T>(url, data, config)
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put<T>(url, data, config)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete<T>(url, config)
  },

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch<T>(url, data, config)
  },
}

export default apiClient
