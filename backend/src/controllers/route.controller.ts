import { Request, Response } from 'express'
import { RouteService } from '../services/route.service.js'
import { CreateRouteRequest, AddPositionsRequest } from '../types/route.types.js'

export class RouteController {
  /**
   * Create a new route
   * POST /api/routes
   */
  static async createRoute(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: 'User not authenticated',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { activityId, startTime } = req.body as CreateRouteRequest

      if (!startTime) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Start time is required',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const route = await RouteService.createRoute(userId, {
        activityId: activityId || null,
        startTime: new Date(startTime),
      })

      res.status(201).json({
        success: true,
        data: route,
      })
    } catch (error) {
      console.error('Create route error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create route',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Add GPS positions to a route
   * POST /api/routes/:id/positions
   */
  static async addPositions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_UNAUTHORIZED',
            message: 'User not authenticated',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const { id } = req.params
      const { positions } = req.body as AddPositionsRequest

      if (!positions || !Array.isArray(positions) || positions.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_REQUIRED_FIELD',
            message: 'Positions array is required and must not be empty',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      const route = await RouteService.addPositions(id, userId, positions)

      res.status(200).json({
        success: true,
        data: route,
      })
    } catch (error) {
      console.error('Add positions error:', error)
      
      if (error instanceof Error) {
        if (error.message === 'Route not found') {
          res.status(404).json({
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'Route not found',
            },
            timestamp: new Date().toISOString(),
          })
          return
        }

        if (error.message === 'Unauthorized to update this route') {
          res.status(403).json({
            success: false,
            error: {
              code: 'AUTH_UNAUTHORIZED',
              message: 'You are not authorized to update this route',
            },
            timestamp: new Date().toISOString(),
          })
          return
        }
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to add positions',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get route by ID
   * GET /api/routes/:id
   */
  static async getRoute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const route = await RouteService.getRouteById(id)

      if (!route) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Route not found',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      res.status(200).json({
        success: true,
        data: route,
      })
    } catch (error) {
      console.error('Get route error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve route',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get route metrics
   * GET /api/routes/:id/metrics
   */
  static async getRouteMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      const metrics = await RouteService.getRouteMetrics(id)

      res.status(200).json({
        success: true,
        data: metrics,
      })
    } catch (error) {
      console.error('Get route metrics error:', error)
      
      if (error instanceof Error && error.message === 'Route not found') {
        res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Route not found',
          },
          timestamp: new Date().toISOString(),
        })
        return
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve metrics',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get user's route history
   * GET /api/routes/user/:userId
   */
  static async getUserRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10

      const result = await RouteService.getUserRoutes(userId, page, limit)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      console.error('Get user routes error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve route history',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }
}
