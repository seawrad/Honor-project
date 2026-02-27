import { Request, Response } from 'express'
import { MemoryCardService } from '../services/memoryCard.service.js'
import { AchievementService } from '../services/achievement.service.js'

export class MemoryCardController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId!
      const data = req.body
      const card = await MemoryCardService.create(userId, {
        activityId: data.activityId,
        routeId: data.routeId,
        runDate: data.runDate,
        participantCount: data.participantCount ?? 1,
        totalDistance: data.totalDistance,
        averageSpeed: data.averageSpeed,
        durationSeconds: data.durationSeconds,
        weatherTemp: data.weatherTemp,
        weatherDesc: data.weatherDesc,
        newsHeadline: data.newsHeadline,
        messages: data.messages,
        routeSummary: data.routeSummary,
      })
      // Check for new achievements (e.g. memory_card badge)
      const newlyUnlocked = await AchievementService.checkAndAwardAchievements(userId)
      res.status(201).json({
        success: true,
        data: { ...card, newlyUnlockedAchievements: newlyUnlocked },
      })
    } catch (error) {
      console.error('Create memory card error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create memory card',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const card = await MemoryCardService.getById(id)
      if (!card) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Memory card not found',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }
      res.json({ success: true, data: card })
    } catch (error) {
      console.error('Get memory card error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve memory card',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  static async getByActivityId(req: Request, res: Response): Promise<void> {
    try {
      const { activityId } = req.params
      const cards = await MemoryCardService.getByActivityId(activityId)
      res.json({ success: true, data: cards })
    } catch (error) {
      console.error('Get memory cards by activity error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve memory cards',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }
}
