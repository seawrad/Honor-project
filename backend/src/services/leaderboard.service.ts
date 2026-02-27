import { db } from '../database/db.js'

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  value: number
  unit: string
}

export type LeaderboardType = 'weekly_km' | 'monthly_km' | 'weekly_runs' | 'monthly_runs'

function getWeekStart(): Date {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

function getMonthStart(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export class LeaderboardService {
  static async getLeaderboard(
    type: LeaderboardType,
    limit: number = 20
  ): Promise<LeaderboardEntry[]> {
    const weekStart = getWeekStart()
    const monthStart = getMonthStart()

    let query: string
    let params: any[]

    if (type === 'weekly_km' || type === 'monthly_km') {
      const start = type === 'weekly_km' ? weekStart : monthStart
      query = `
        SELECT 
          r.user_id,
          u.display_name,
          COALESCE(SUM(r.total_distance), 0)::numeric as total
        FROM routes r
        JOIN users u ON r.user_id = u.id
        WHERE r.start_time >= $1
        GROUP BY r.user_id, u.display_name
        ORDER BY total DESC
        LIMIT $2
      `
      params = [start, limit]
    } else {
      const start = type === 'weekly_runs' ? weekStart : monthStart
      query = `
        SELECT 
          r.user_id,
          u.display_name,
          COUNT(*)::int as total
        FROM routes r
        JOIN users u ON r.user_id = u.id
        WHERE r.start_time >= $1
        GROUP BY r.user_id, u.display_name
        ORDER BY total DESC
        LIMIT $2
      `
      params = [start, limit]
    }

    const result = await db.query(query, params)
    const unit = type.includes('km') ? 'km' : '次'
    return result.rows.map((row: any, i: number) => ({
      rank: i + 1,
      userId: row.user_id,
      displayName: row.display_name,
      value: type.includes('km') ? parseFloat(row.total) : parseInt(row.total),
      unit,
    }))
  }
}
