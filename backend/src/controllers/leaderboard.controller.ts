import { Request, Response } from 'express'
import { LeaderboardService } from '../services/leaderboard.service.js'

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const type = (req.query.type as string) || 'weekly_km'
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
      const validTypes = ['weekly_km', 'monthly_km', 'weekly_runs', 'monthly_runs']
      if (!validTypes.includes(type)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid leaderboard type' },
        })
        return
      }
      const entries = await LeaderboardService.getLeaderboard(type as any, limit)
      res.json({ success: true, data: entries })
    } catch (error) {
      console.error('Get leaderboard error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch leaderboard' },
      })
    }
  }
}
