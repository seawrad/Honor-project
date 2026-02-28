import { db } from '../database/db.js'
import { S3Service } from '../utils/s3.js'
import {
  Route,
  CreateRouteRequest,
  GPSPosition,
  RouteMetrics,
  RouteWithActivity,
} from '../types/route.types.js'

export class RouteService {
  /**
   * Create a new route
   */
  static async createRoute(userId: string, data: CreateRouteRequest): Promise<Route> {
    const query = `
      INSERT INTO routes (activity_id, user_id, start_time, total_distance, average_speed, duration, end_time)
      VALUES ($1, $2, $3, 0, 0, 0, $3)
      RETURNING 
        id,
        activity_id as "activityId",
        user_id as "userId",
        total_distance as "totalDistance",
        average_speed as "averageSpeed",
        duration,
        start_time as "startTime",
        end_time as "endTime",
        positions_s3_key as "positionsS3Key",
        created_at as "createdAt"
    `

    const values = [data.activityId ?? null, userId, data.startTime]

    try {
      const result = await db.query<Route>(query, values)
      return result.rows[0]
    } catch (error) {
      console.error('Failed to create route:', error)
      throw new Error('Failed to create route')
    }
  }

  /**
   * Add GPS positions to a route
   */
  static async addPositions(
    routeId: string,
    userId: string,
    positions: GPSPosition[]
  ): Promise<Route> {
    // First, verify the route belongs to the user
    const routeQuery = `
      SELECT id, user_id as "userId"
      FROM routes
      WHERE id = $1
    `
    const routeResult = await db.query(routeQuery, [routeId])

    if (routeResult.rows.length === 0) {
      throw new Error('Route not found')
    }

    if (routeResult.rows[0].userId !== userId) {
      throw new Error('Unauthorized to update this route')
    }

    // Calculate metrics first (needed regardless of storage)
    const metrics = this.calculateMetrics(positions)
    const endTime = positions[positions.length - 1].timestamp

    // Try S3 first; always store in DB as backup (for when S3 read fails, e.g. local dev)
    let s3Key: string | null = null
    const positionsJson = JSON.stringify(positions)

    try {
      s3Key = await S3Service.uploadPositions(routeId, positions)
    } catch (s3Error) {
      console.warn('S3 upload failed, using database storage:', s3Error)
    }

    // Update route with metrics and storage key/json
    const updateQuery = `
      UPDATE routes
      SET 
        total_distance = $1,
        average_speed = $2,
        duration = $3,
        end_time = $4,
        positions_s3_key = $5,
        positions_json = $6
      WHERE id = $7
      RETURNING 
        id,
        activity_id as "activityId",
        user_id as "userId",
        total_distance as "totalDistance",
        average_speed as "averageSpeed",
        duration,
        start_time as "startTime",
        end_time as "endTime",
        positions_s3_key as "positionsS3Key",
        created_at as "createdAt"
    `

    const values = [
      metrics.totalDistance,
      metrics.averageSpeed,
      metrics.duration,
      endTime,
      s3Key,
      positionsJson,
      routeId,
    ]

    try {
      const result = await db.query<Route>(updateQuery, values)
      return result.rows[0]
    } catch (error) {
      console.error('Failed to add positions:', error)
      throw new Error('Failed to add GPS positions')
    }
  }

  /**
   * Get route by ID
   */
  static async getRouteById(routeId: string): Promise<Route | null> {
    const query = `
      SELECT 
        id,
        activity_id as "activityId",
        user_id as "userId",
        total_distance as "totalDistance",
        average_speed as "averageSpeed",
        duration,
        start_time as "startTime",
        end_time as "endTime",
        positions_s3_key as "positionsS3Key",
        created_at as "createdAt"
      FROM routes
      WHERE id = $1
    `

    try {
      const result = await db.query<Route>(query, [routeId])
      return result.rows[0] || null
    } catch (error) {
      console.error('Failed to get route:', error)
      throw new Error('Failed to retrieve route')
    }
  }

  /**
   * Get route by ID with GPS positions (for map display)
   */
  static async getRouteWithPositions(routeId: string): Promise<(Route & { positions: GPSPosition[] }) | null> {
    const route = await this.getRouteById(routeId)
    if (!route) return null
    const positions = await this.getRoutePositions(routeId)
    return { ...route, positions }
  }

  /**
   * Get GPS positions for a route (from S3 or DB fallback)
   */
  static async getRoutePositions(routeId: string): Promise<GPSPosition[]> {
    const query = `
      SELECT positions_s3_key as "positionsS3Key", positions_json
      FROM routes WHERE id = $1
    `
    const result = await db.query(query, [routeId])
    if (result.rows.length === 0) return []

    const row = result.rows[0] as { positionsS3Key?: string; positions_json?: string }
    // Prefer positions_json (DB) - more reliable when S3 unavailable
    if (row.positions_json) {
      try {
        const parsed = JSON.parse(row.positions_json) as GPSPosition[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {
        // fall through to S3
      }
    }
    if (row.positionsS3Key) {
      try {
        return await S3Service.getPositions(row.positionsS3Key)
      } catch {
        return []
      }
    }
    return []
  }

  /**
   * Get route metrics
   */
  static async getRouteMetrics(routeId: string): Promise<RouteMetrics> {
    const route = await this.getRouteById(routeId)

    if (!route) {
      throw new Error('Route not found')
    }

    const elapsedTime = Math.floor(
      (new Date(route.endTime).getTime() - new Date(route.startTime).getTime()) / 1000
    )

    return {
      totalDistance: route.totalDistance,
      averageSpeed: route.averageSpeed,
      duration: route.duration,
      elapsedTime,
    }
  }

  /**
   * Get user's route history
   */
  static async getUserRoutes(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ routes: RouteWithActivity[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM routes
      WHERE user_id = $1
    `
    const countResult = await db.query(countQuery, [userId])
    const total = parseInt(countResult.rows[0].count)

    // Get routes with activity information
    const query = `
      SELECT 
        r.id,
        r.activity_id as "activityId",
        r.user_id as "userId",
        r.total_distance as "totalDistance",
        r.average_speed as "averageSpeed",
        r.duration,
        r.start_time as "startTime",
        r.end_time as "endTime",
        r.positions_s3_key as "positionsS3Key",
        r.created_at as "createdAt",
        a.id as "activity.id",
        a.title as "activity.title",
        a.scheduled_date as "activity.scheduledDate",
        a.distance as "activity.distance"
      FROM routes r
      LEFT JOIN activities a ON r.activity_id = a.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `

    try {
      const result = await db.query(query, [userId, limit, offset])

      const routes: RouteWithActivity[] = result.rows.map((row: any) => ({
        id: row.id,
        activityId: row.activityId,
        userId: row.userId,
        totalDistance: row.totalDistance,
        averageSpeed: row.averageSpeed,
        duration: row.duration,
        startTime: row.startTime,
        endTime: row.endTime,
        positionsS3Key: row.positionsS3Key,
        createdAt: row.createdAt,
        activity: {
          id: row['activity.id'],
          title: row['activity.title'],
          scheduledDate: row['activity.scheduledDate'],
          distance: row['activity.distance'],
        },
      }))

      return {
        routes,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      }
    } catch (error) {
      console.error('Failed to get user routes:', error)
      throw new Error('Failed to retrieve route history')
    }
  }

  /**
   * Calculate metrics from GPS positions
   */
  private static calculateMetrics(positions: GPSPosition[]): RouteMetrics {
    if (positions.length < 2) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        duration: 0,
        elapsedTime: 0,
      }
    }

    // Calculate total distance using Haversine formula
    let totalDistance = 0
    for (let i = 1; i < positions.length; i++) {
      const distance = this.calculateDistance(
        positions[i - 1].latitude,
        positions[i - 1].longitude,
        positions[i].latitude,
        positions[i].longitude
      )
      totalDistance += distance
    }

    // Calculate duration in seconds
    const startTime = new Date(positions[0].timestamp).getTime()
    const endTime = new Date(positions[positions.length - 1].timestamp).getTime()
    const duration = Math.floor((endTime - startTime) / 1000)

    // Calculate average speed (km/h)
    const averageSpeed = duration > 0 ? (totalDistance / duration) * 3600 : 0

    return {
      totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimal places
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      duration,
      elapsedTime: duration,
    }
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
