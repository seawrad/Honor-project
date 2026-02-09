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

/** RunCrew level thresholds (monthly km): Starter 0, Explorer 10, Runner 25, Champion 50, Legend 100 */
export const RUNCREW_LEVELS = [
  { name: 'Starter', nameZh: '新手', minKm: 0 },
  { name: 'Explorer', nameZh: '探索者', minKm: 10 },
  { name: 'Runner', nameZh: '跑者', minKm: 25 },
  { name: 'Champion', nameZh: '冠軍', minKm: 50 },
  { name: 'Legend', nameZh: '傳奇', minKm: 100 },
] as const

export interface UserStatsSummary {
  weeklyDistanceKm: number
  monthlyCompletedActivities: number
  monthlyDistanceKm: number
  level: {
    name: string
    nameZh: string
    currentKm: number
    nextLevelKm: number | null
    progressPercent: number
  }
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
