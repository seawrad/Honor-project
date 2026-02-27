import { db } from '../database/db.js'

export interface AchievementWithUnlock {
  id: string
  code: string
  name: string
  name_zh: string
  description: string
  description_zh: string
  icon: string
  condition_type: string
  condition_value: number | null
  sort_order: number
  unlocked_at: string | null
}

export class AchievementService {
  static async getAchievementsForUser(userId: string): Promise<AchievementWithUnlock[]> {
    const result = await db.query(
      `SELECT 
        a.id, a.code, a.name, a.name_zh, a.description, a.description_zh,
        a.icon, a.condition_type, a.condition_value, a.sort_order,
        ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
       ORDER BY a.sort_order, a.condition_value`,
      [userId]
    )
    return result.rows
  }

  static async getUnlockedCount(userId: string): Promise<number> {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = $1',
      [userId]
    )
    return parseInt(result.rows[0].count)
  }

  static async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    await db.query(
      `INSERT INTO user_achievements (user_id, achievement_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, achievement_id) DO NOTHING`,
      [userId, achievementId]
    )
  }

  static async checkAndAwardAchievements(userId: string): Promise<string[]> {
    const newlyUnlocked: string[] = []

    // Get user stats from routes (actual runs) + activity participation
    const statsResult = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM routes WHERE user_id = $1) as total_runs,
        (SELECT COALESCE(SUM(total_distance), 0) FROM routes WHERE user_id = $1) as total_distance_km,
        (SELECT COALESCE(MAX(total_distance), 0) FROM routes WHERE user_id = $1) as max_single_run_km`,
      [userId]
    )
    const stats = statsResult.rows[0]
    const totalRuns = parseInt(stats?.total_runs || '0')
    const totalDistanceKm = parseFloat(stats?.total_distance_km || '0')
    const maxSingleRunKm = parseFloat(stats?.max_single_run_km || '0')

    // Get memory cards count
    const memResult = await db.query(
      'SELECT COUNT(*) as count FROM run_memory_cards WHERE created_by = $1',
      [userId]
    )
    const memoryCardsCount = parseInt(memResult.rows[0]?.count || '0')

    // Get early run (before 8am)
    const earlyResult = await db.query(
      `SELECT 1 FROM routes r
       JOIN activities a ON r.activity_id = a.id
       WHERE r.user_id = $1 AND EXTRACT(HOUR FROM r.start_time) < 8
       LIMIT 1`,
      [userId]
    )
    const hasEarlyRun = earlyResult.rows.length > 0

    // Get unique activities count
    const uniqueResult = await db.query(
      'SELECT COUNT(DISTINCT activity_id) as count FROM activity_participants WHERE user_id = $1',
      [userId]
    )
    const uniqueActivities = parseInt(uniqueResult.rows[0]?.count || '0')

    // Solo runs count
    const soloResult = await db.query(
      'SELECT COUNT(*) as count FROM routes WHERE user_id = $1 AND activity_id IS NULL',
      [userId]
    )
    const soloRunsCount = parseInt(soloResult.rows[0]?.count || '0')

    // Weekly streak (simplified: count distinct weeks with runs)
    const streakResult = await db.query(
      `SELECT COUNT(DISTINCT DATE_TRUNC('week', r.start_time)) as weeks
       FROM routes r
       JOIN activities a ON r.activity_id = a.id AND a.status = 'completed'
       WHERE r.user_id = $1
       AND r.start_time >= NOW() - INTERVAL '8 weeks'`,
      [userId]
    )
    const recentWeeksWithRuns = parseInt(streakResult.rows[0]?.weeks || '0')

    const conditions: { code: string; met: boolean }[] = [
      { code: 'first_run', met: totalRuns >= 1 },
      { code: 'run_3', met: totalRuns >= 3 },
      { code: 'run_5', met: totalRuns >= 5 },
      { code: 'run_10', met: totalRuns >= 10 },
      { code: 'run_25', met: totalRuns >= 25 },
      { code: 'run_50', met: totalRuns >= 50 },
      { code: 'run_100', met: totalRuns >= 100 },
      { code: 'first_5k', met: maxSingleRunKm >= 5 },
      { code: 'first_10k', met: maxSingleRunKm >= 10 },
      { code: 'first_half', met: maxSingleRunKm >= 21 },
      { code: 'first_marathon', met: maxSingleRunKm >= 42 },
      { code: 'total_50k', met: totalDistanceKm >= 50 },
      { code: 'total_100k', met: totalDistanceKm >= 100 },
      { code: 'total_250k', met: totalDistanceKm >= 250 },
      { code: 'total_500k', met: totalDistanceKm >= 500 },
      { code: 'total_1000k', met: totalDistanceKm >= 1000 },
      { code: 'week_streak_3', met: recentWeeksWithRuns >= 3 },
      { code: 'week_streak_4', met: recentWeeksWithRuns >= 4 },
      { code: 'week_streak_7', met: recentWeeksWithRuns >= 7 },
      { code: 'social_5', met: uniqueActivities >= 5 },
      { code: 'social_10', met: uniqueActivities >= 10 },
      { code: 'early_bird', met: hasEarlyRun },
      { code: 'memory_card', met: memoryCardsCount >= 1 },
      { code: 'memory_card_5', met: memoryCardsCount >= 5 },
      { code: 'memory_card_10', met: memoryCardsCount >= 10 },
      { code: 'first_solo_run', met: soloRunsCount >= 1 },
    ]

    for (const { code, met } of conditions) {
      if (!met) continue
      const achResult = await db.query('SELECT id FROM achievements WHERE code = $1', [code])
      if (achResult.rows.length === 0) continue
      const achievementId = achResult.rows[0].id

      const existing = await db.query(
        'SELECT 1 FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievementId]
      )
      if (existing.rows.length > 0) continue

      await db.query(
        `INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)
         ON CONFLICT (user_id, achievement_id) DO NOTHING`,
        [userId, achievementId]
      )
      newlyUnlocked.push(code)
    }

    return newlyUnlocked
  }
}
