export interface RunMemoryCard {
  id: string
  activityId: string | null
  routeId?: string
  createdBy: string
  createdAt: string
  runDate: string
  participantCount: number
  totalDistance: number
  averageSpeed: number
  durationSeconds: number
  weatherTemp?: number
  weatherDesc?: string
  newsHeadline?: string
  aiImageUrl?: string
  groupPhotoUrl?: string
  messages: { userId: string; displayName: string; content: string }[]
  routeSummary?: { pointCount: number; pathPreview?: [number, number][] }
}

export interface CreateMemoryCardRequest {
  activityId?: string | null
  routeId?: string
  runDate: string
  participantCount: number
  totalDistance: number
  averageSpeed: number
  durationSeconds: number
  weatherTemp?: number
  weatherDesc?: string
  newsHeadline?: string
  messages?: { userId: string; displayName: string; content: string }[]
  routeSummary?: { pointCount: number; pathPreview?: [number, number][] }
}
