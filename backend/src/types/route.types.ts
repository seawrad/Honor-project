export interface GPSPosition {
  latitude: number
  longitude: number
  timestamp: Date
  accuracy: number
}

export interface Route {
  id: string
  activityId: string
  userId: string
  totalDistance: number
  averageSpeed: number
  duration: number
  startTime: Date
  endTime: Date
  positionsS3Key?: string
  createdAt: Date
}

export interface CreateRouteRequest {
  activityId: string
  startTime: Date
}

export interface AddPositionsRequest {
  positions: GPSPosition[]
}

export interface RouteMetrics {
  totalDistance: number
  averageSpeed: number
  duration: number
  elapsedTime: number
}

export interface RouteWithActivity extends Route {
  activity: {
    id: string
    title: string
    scheduledDate: Date
    distance: number
  }
}
