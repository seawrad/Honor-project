import { Request, Response } from 'express'
import { requireUserId } from '../middleware/auth.middleware.js'
import { AchievementService } from '../services/achievement.service.js'

export class AchievementController {
  static async getMyAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const rows = await AchievementService.getAchievementsForUser(userId)
      const achievements = rows.map((r: any) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        nameZh: r.name_zh,
        description: r.description,
        descriptionZh: r.description_zh,
        icon: r.icon,
        conditionType: r.condition_type,
        conditionValue: r.condition_value,
        sortOrder: r.sort_order,
        unlockedAt: r.unlocked_at,
        isUnlocked: !!r.unlocked_at,
      }))
      res.json({ success: true, data: achievements })
    } catch (error) {
      console.error('Error fetching achievements:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch achievements' },
      })
    }
  }

  static async getUnlockedCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const count = await AchievementService.getUnlockedCount(userId)
      res.json({ success: true, data: { count } })
    } catch (error) {
      console.error('Error fetching achievement count:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch count' },
      })
    }
  }

  static async checkAchievements(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const newlyUnlocked = await AchievementService.checkAndAwardAchievements(userId)
      res.json({ success: true, data: { newlyUnlocked } })
    } catch (error) {
      console.error('Error checking achievements:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to check achievements' },
      })
    }
  }
}
