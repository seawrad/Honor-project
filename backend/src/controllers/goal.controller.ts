import { Request, Response } from 'express'
import { requireUserId } from '../middleware/auth.middleware.js'
import { GoalService } from '../services/goal.service.js'

export class GoalController {
  static async getMyGoals(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const goals = await GoalService.getCurrentGoals(userId)
      res.json({ success: true, data: goals })
    } catch (error) {
      console.error('Get goals error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch goals' },
      })
    }
  }

  static async setWeeklyGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const { targetKm } = req.body
      if (typeof targetKm !== 'number' || targetKm <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'targetKm must be a positive number' },
        })
        return
      }
      const goal = await GoalService.setWeeklyKmGoal(userId, targetKm)
      res.json({ success: true, data: goal })
    } catch (error) {
      console.error('Set weekly goal error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to set goal' },
      })
    }
  }

  static async setMonthlyGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = requireUserId(req)
      const { targetKm } = req.body
      if (typeof targetKm !== 'number' || targetKm <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'targetKm must be a positive number' },
        })
        return
      }
      const goal = await GoalService.setMonthlyKmGoal(userId, targetKm)
      res.json({ success: true, data: goal })
    } catch (error) {
      console.error('Set monthly goal error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to set goal' },
      })
    }
  }
}
