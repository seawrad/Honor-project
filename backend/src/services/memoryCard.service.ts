import { db } from '../database/db.js'
import { RunMemoryCard, CreateMemoryCardRequest } from '../types/memoryCard.types.js'

export class MemoryCardService {
  static async create(
    userId: string,
    data: CreateMemoryCardRequest
  ): Promise<RunMemoryCard> {
    const query = `
      INSERT INTO run_memory_cards (
        activity_id, route_id, created_by, run_date,
        participant_count, total_distance, average_speed, duration_seconds,
        weather_temp, weather_desc, news_headline, messages, route_summary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb)
      RETURNING 
        id,
        activity_id as "activityId",
        route_id as "routeId",
        created_by as "createdBy",
        created_at as "createdAt",
        run_date as "runDate",
        participant_count as "participantCount",
        total_distance as "totalDistance",
        average_speed as "averageSpeed",
        duration_seconds as "durationSeconds",
        weather_temp as "weatherTemp",
        weather_desc as "weatherDesc",
        news_headline as "newsHeadline",
        ai_image_url as "aiImageUrl",
        group_photo_url as "groupPhotoUrl",
        messages,
        route_summary as "routeSummary"
    `
    const values = [
      data.activityId,
      data.routeId || null,
      userId,
      data.runDate,
      data.participantCount,
      data.totalDistance,
      data.averageSpeed,
      data.durationSeconds,
      data.weatherTemp ?? null,
      data.weatherDesc ?? null,
      data.newsHeadline ?? null,
      JSON.stringify(data.messages || []),
      data.routeSummary ? JSON.stringify(data.routeSummary) : null,
    ]
    const result = await db.query(query, values)
    const row = result.rows[0]
    return {
      ...row,
      messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages || [],
    }
  }

  static async getById(id: string): Promise<RunMemoryCard | null> {
    const query = `
      SELECT 
        id,
        activity_id as "activityId",
        route_id as "routeId",
        created_by as "createdBy",
        created_at as "createdAt",
        run_date as "runDate",
        participant_count as "participantCount",
        total_distance as "totalDistance",
        average_speed as "averageSpeed",
        duration_seconds as "durationSeconds",
        weather_temp as "weatherTemp",
        weather_desc as "weatherDesc",
        news_headline as "newsHeadline",
        ai_image_url as "aiImageUrl",
        group_photo_url as "groupPhotoUrl",
        messages,
        route_summary as "routeSummary"
      FROM run_memory_cards
      WHERE id = $1
    `
    const result = await db.query(query, [id])
    if (result.rows.length === 0) return null
    const row = result.rows[0]
    return {
      ...row,
      messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages || [],
    }
  }

  static async getByActivityId(activityId: string): Promise<RunMemoryCard[]> {
    const query = `
      SELECT 
        id,
        activity_id as "activityId",
        route_id as "routeId",
        created_by as "createdBy",
        created_at as "createdAt",
        run_date as "runDate",
        participant_count as "participantCount",
        total_distance as "totalDistance",
        average_speed as "averageSpeed",
        duration_seconds as "durationSeconds",
        weather_temp as "weatherTemp",
        weather_desc as "weatherDesc",
        news_headline as "newsHeadline",
        ai_image_url as "aiImageUrl",
        group_photo_url as "groupPhotoUrl",
        messages,
        route_summary as "routeSummary"
      FROM run_memory_cards
      WHERE activity_id = $1
      ORDER BY created_at DESC
    `
    const result = await db.query(query, [activityId])
    return result.rows.map((row: any) => ({
      ...row,
      messages: typeof row.messages === 'string' ? JSON.parse(row.messages) : row.messages || [],
    }))
  }
}
