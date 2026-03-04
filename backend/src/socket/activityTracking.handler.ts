import { Server } from 'socket.io'
import { AuthenticatedSocket } from '../types/socket.types.js'
import { db } from '../database/db.js'

const TRACKING_ROOM_PREFIX = 'activity-tracking:'

async function isActivityParticipantOrCreator(activityId: string, userId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1 FROM activities WHERE id = $1 AND creator_id = $2
     UNION
     SELECT 1 FROM activity_participants WHERE activity_id = $1 AND user_id = $2`,
    [activityId, userId]
  )
  return result.rows.length > 0
}

export interface LocationUpdatePayload {
  activityId: string
  latitude: number
  longitude: number
  /** Speed in km/h (optional, from client) */
  speedKmh?: number
}

export interface LocationReceivedPayload {
  userId: string
  displayName: string
  isHost: boolean
  latitude: number
  longitude: number
  avatarUrl?: string | null
  /** Speed in km/h */
  speedKmh?: number
}

export function setupActivityTrackingHandlers(io: Server): void {
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId
    if (!userId) return

    socket.on('join_activity_tracking', async (payload: { activityId: string }) => {
      try {
        const { activityId } = payload
        if (!activityId) {
          socket.emit('error', { code: 'VALIDATION_REQUIRED_FIELD', message: 'Activity ID is required' })
          return
        }

        const allowed = await isActivityParticipantOrCreator(activityId, userId)
        if (!allowed) {
          socket.emit('error', { code: 'ACCESS_DENIED', message: 'You are not a participant of this activity' })
          return
        }

        const roomId = TRACKING_ROOM_PREFIX + activityId
        socket.join(roomId)
        socket.emit('joined_activity_tracking', { activityId })
      } catch (err) {
        console.error('join_activity_tracking error:', err)
        socket.emit('error', { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to join tracking' })
      }
    })

    socket.on('leave_activity_tracking', (payload: { activityId: string }) => {
      const { activityId } = payload
      if (activityId) {
        socket.leave(TRACKING_ROOM_PREFIX + activityId)
      }
    })

    socket.on('location_update', async (payload: LocationUpdatePayload) => {
      try {
        const { activityId, latitude, longitude, speedKmh } = payload
        if (!activityId || latitude == null || longitude == null) return

        const allowed = await isActivityParticipantOrCreator(activityId, userId)
        if (!allowed) return

        const [userResult, activityResult] = await Promise.all([
          db.query('SELECT display_name, avatar_url FROM users WHERE id = $1', [userId]),
          db.query('SELECT creator_id FROM activities WHERE id = $1', [activityId]),
        ])
        const displayName = userResult.rows[0]?.display_name || 'Unknown'
        const avatarUrl = userResult.rows[0]?.avatar_url ?? null
        const creatorId = activityResult.rows[0]?.creator_id
        const isHost = creatorId === userId

        const locationPayload: LocationReceivedPayload = {
          userId,
          displayName,
          isHost,
          latitude,
          longitude,
          avatarUrl,
          speedKmh: speedKmh ?? undefined,
        }

        const roomId = TRACKING_ROOM_PREFIX + activityId
        socket.to(roomId).emit('location_received', locationPayload)
      } catch (err) {
        console.error('location_update error:', err)
      }
    })
  })
}
