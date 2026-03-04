import { db } from '../database/db.js'

export type GoalType = 'weekly_km' | 'monthly_km' | 'weekly_runs' | 'monthly_runs'

export interface UserGoal {
  id: string
  userId: string
  goalType: GoalType
  targetValue: number
  periodStart: string
  periodEnd: string
  currentValue?: number
  progressPercent?: number
}

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - now.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function getMonthBounds(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export class GoalService {
  static async getCurrentGoals(userId: string): Promise<UserGoal[]> {
    const { end: weekEnd } = getWeekBounds()
    const { end: monthEnd } = getMonthBounds()

    const goalsResult = await db.query(
      `SELECT id, user_id, goal_type, target_value, period_start, period_end
       FROM user_goals
       WHERE user_id = $1
       AND (
         (period_start <= $2 AND period_end >= $2)
         OR (period_start <= $3 AND period_end >= $3)
       )`,
      [userId, weekEnd, monthEnd]
    )

    const goals: UserGoal[] = []
    for (const row of goalsResult.rows) {
      const goal: UserGoal = {
        id: row.id,
        userId: row.user_id,
        goalType: row.goal_type,
        targetValue: parseFloat(row.target_value),
        periodStart: row.period_start.toISOString().slice(0, 10),
        periodEnd: row.period_end.toISOString().slice(0, 10),
      }

      const start = new Date(row.period_start)
      const end = new Date(row.period_end)

      if (row.goal_type === 'weekly_km' || row.goal_type === 'monthly_km') {
        const distResult = await db.query(
          `SELECT COALESCE(SUM(total_distance), 0) as total
           FROM routes WHERE user_id = $1 AND start_time >= $2 AND start_time <= $3`,
          [userId, start, end]
        )
        const current = parseFloat(distResult.rows[0]?.total ?? 0)
        goal.currentValue = Math.round(current * 10) / 10
        goal.progressPercent = Math.min(100, Math.round((current / goal.targetValue) * 100))
      } else {
        const countResult = await db.query(
          `SELECT COUNT(*) as count FROM routes
           WHERE user_id = $1 AND start_time >= $2 AND start_time <= $3`,
          [userId, start, end]
        )
        const current = parseInt(countResult.rows[0]?.count ?? 0)
        goal.currentValue = current
        goal.progressPercent = Math.min(100, Math.round((current / goal.targetValue) * 100))
      }
      goals.push(goal)
    }
    return goals
  }

  static async setGoal(
    userId: string,
    goalType: GoalType,
    targetValue: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<UserGoal> {
    const result = await db.query(
      `INSERT INTO user_goals (user_id, goal_type, target_value, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, goal_type, period_start)
       DO UPDATE SET target_value = $3, period_end = $5
       RETURNING id, user_id, goal_type, target_value, period_start, period_end`,
      [userId, goalType, targetValue, periodStart, periodEnd]
    )
    const row = result.rows[0]
    return {
      id: row.id,
      userId: row.user_id,
      goalType: row.goal_type,
      targetValue: parseFloat(row.target_value),
      periodStart: row.period_start.toISOString().slice(0, 10),
      periodEnd: row.period_end.toISOString().slice(0, 10),
    }
  }

  static async setWeeklyKmGoal(userId: string, targetKm: number): Promise<UserGoal> {
    const { start, end } = getWeekBounds()
    return this.setGoal(userId, 'weekly_km', targetKm, start, end)
  }

  static async setMonthlyKmGoal(userId: string, targetKm: number): Promise<UserGoal> {
    const { start, end } = getMonthBounds()
    return this.setGoal(userId, 'monthly_km', targetKm, start, end)
  }
}
