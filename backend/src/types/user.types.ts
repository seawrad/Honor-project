export interface UserProfile {
  id: string
  email: string
  displayName: string
  age: number
  totalRuns: number
  totalDistance: number
  averageRating: number
  followersCount: number
  followingCount: number
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  displayName?: string
  age?: number
}

export interface UserStats {
  totalRuns: number
  totalDistance: number
  averageRating: number
}

export interface UserSearchResult {
  id: string
  displayName: string
  totalRuns: number
  averageRating: number
  isFollowing: boolean
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
