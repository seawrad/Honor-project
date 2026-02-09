export interface RecentActivity {
  id: string
  title: string
  scheduledDate: string
  distance: number
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled'
}

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
  avatarUrl?: string | null
  isFollowing?: boolean
  recentActivities: RecentActivity[]
  joinedDate: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  displayName?: string
  age?: number
  avatarUrl?: string | null
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
