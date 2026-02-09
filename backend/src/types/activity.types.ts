// Activity types and interfaces

export type ActivityType = 'time-based' | 'route-based'

export interface Activity {
  id: string
  creatorId: string
  creatorName: string
  title: string
  description: string
  scheduledDate: string
  latitude: number
  longitude: number
  address: string
  route: string
  distance: number
  maxParticipants: number
  currentParticipants: number
  status: ActivityStatus
  activityType: ActivityType
  durationMinutes?: number
  endLatitude?: number
  endLongitude?: number
  endAddress?: string
  createdAt: string
  updatedAt: string
}

export type ActivityStatus = 'upcoming' | 'in-progress' | 'completed' | 'cancelled'

export interface CreateActivityRequest {
  title: string
  description?: string
  scheduledDate: string
  latitude: number
  longitude: number
  address: string
  route?: string
  distance: number
  maxParticipants: number
  activityType: ActivityType
  durationMinutes?: number
  endLatitude?: number
  endLongitude?: number
  endAddress?: string
}

export interface UpdateActivityRequest {
  title?: string
  description?: string
  scheduledDate?: string
  latitude?: number
  longitude?: number
  address?: string
  route?: string
  distance?: number
  maxParticipants?: number
}

export interface ActivityParticipant {
  userId: string
  displayName: string
  joinedAt: string
}

export interface ActivityWithParticipants extends Activity {
  participants: ActivityParticipant[]
}

export interface ActivitySearchFilters {
  latitude?: number
  longitude?: number
  radius?: number // in kilometers
  startDate?: string
  endDate?: string
  minDistance?: number
  maxDistance?: number
  status?: ActivityStatus
  activityType?: ActivityType
}

export interface ActivitySearchResult {
  activities: Activity[]
  total: number
}

export interface ActivityRating {
  id: string
  activityId: string
  userId: string
  userName: string
  rating: number
  feedback?: string
  createdAt: string
}

export interface CreateRatingRequest {
  rating: number
  feedback?: string
}

export interface ActivityRatingSummary {
  averageRating: number
  ratingCount: number
  ratings: ActivityRating[]
}
