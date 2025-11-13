export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  age: number
  agreedToTerms: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  success: true
  data: {
    user: {
      id: string
      email: string
      displayName: string
      age: number
      createdAt: string
    }
    accessToken: string
    refreshToken: string
  }
}

export interface User {
  id: string
  email: string
  displayName: string
  age: number
  createdAt: Date
  updatedAt: Date
}
