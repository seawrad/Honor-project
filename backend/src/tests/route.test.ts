import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { RouteService } from '../services/route.service.js'
import { authService } from '../services/auth.service.js'
import { activityService } from '../services/activity.service.js'
import { db } from '../database/db.js'
import { GPSPosition } from '../types/route.types.js'

describe('Route Service', () => {
  let testUserId: string
  let testActivityId: string

  beforeAll(async () => {
    // Ensure database connection
    await db.testConnection()
  })

  afterAll(async () => {
    // Clean up and close database connection
    await db.close()
  })

  beforeEach(async () => {
    // Clean up test data
    try {
      await db.query("DELETE FROM routes WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')")
      await db.query("DELETE FROM activity_participants WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%')")
      await db.query("DELETE FROM activities WHERE creator_id IN (SELECT id FROM users WHERE email LIKE '%test%')")
      await db.query("DELETE FROM users WHERE email LIKE '%test%'")
    } catch (error) {
      console.error('Cleanup error:', error)
    }

    // Create test user
    const user = await authService.register({
      email: 'routetest@example.com',
      password: 'password123',
      displayName: 'Route Test User',
      age: 30,
      agreedToTerms: true,
    })
    testUserId = user.id

    // Create test activity
    const activity = await activityService.createActivity(testUserId, {
      title: 'Test Run',
      description: 'Test running activity',
      scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY',
      route: 'Central Park Loop',
      distance: 5.0,
      maxParticipants: 10,
    })
    testActivityId = activity.id
  })

  describe('Route Creation', () => {
    it('should create a new route', async () => {
      const startTime = new Date()
      const route = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime,
      })

      expect(route).toBeDefined()
      expect(route.id).toBeDefined()
      expect(route.activityId).toBe(testActivityId)
      expect(route.userId).toBe(testUserId)
      expect(route.totalDistance).toBe(0)
      expect(route.averageSpeed).toBe(0)
      expect(route.duration).toBe(0)
    })
  })

  describe('GPS Position Storage', () => {
    it('should add GPS positions and calculate metrics', async () => {
      // Create route
      const startTime = new Date()
      const route = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime,
      })

      // Create sample GPS positions (simulating a 1km run)
      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(startTime.getTime()),
          accuracy: 10,
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date(startTime.getTime() + 60000), // 1 minute later
          accuracy: 10,
        },
        {
          latitude: 40.7148,
          longitude: -74.0080,
          timestamp: new Date(startTime.getTime() + 120000), // 2 minutes later
          accuracy: 10,
        },
      ]

      // Add positions
      const updatedRoute = await RouteService.addPositions(route.id, testUserId, positions)

      expect(updatedRoute).toBeDefined()
      expect(updatedRoute.totalDistance).toBeGreaterThan(0)
      expect(updatedRoute.averageSpeed).toBeGreaterThan(0)
      expect(updatedRoute.duration).toBe(120) // 2 minutes in seconds
      expect(updatedRoute.positionsS3Key).toBeDefined()
    })

    it('should reject adding positions to non-existent route', async () => {
      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10,
        },
      ]

      await expect(
        RouteService.addPositions('non-existent-id', testUserId, positions)
      ).rejects.toThrow('Route not found')
    })

    it('should reject adding positions by unauthorized user', async () => {
      // Create another user
      const otherUser = await authService.register({
        email: 'other@example.com',
        password: 'password123',
        displayName: 'Other User',
        age: 25,
        agreedToTerms: true,
      })

      // Create route with first user
      const route = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime: new Date(),
      })

      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10,
        },
      ]

      // Try to add positions with different user
      await expect(
        RouteService.addPositions(route.id, otherUser.id, positions)
      ).rejects.toThrow('Unauthorized to update this route')
    })
  })

  describe('Metrics Calculation', () => {
    it('should calculate accurate distance from GPS positions', async () => {
      const startTime = new Date()
      const route = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime,
      })

      // Create positions with known distance (approximately 2.2 km)
      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(startTime.getTime()),
          accuracy: 10,
        },
        {
          latitude: 40.7228,
          longitude: -74.0060,
          timestamp: new Date(startTime.getTime() + 300000), // 5 minutes later
          accuracy: 10,
        },
        {
          latitude: 40.7328,
          longitude: -74.0060,
          timestamp: new Date(startTime.getTime() + 600000), // 10 minutes later
          accuracy: 10,
        },
      ]

      const updatedRoute = await RouteService.addPositions(route.id, testUserId, positions)

      // Distance should be approximately 2.2 km (each degree of latitude is ~111 km)
      expect(updatedRoute.totalDistance).toBeGreaterThan(2.0)
      expect(updatedRoute.totalDistance).toBeLessThan(2.5)
    })

    it('should calculate average speed correctly', async () => {
      const startTime = new Date()
      const route = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime,
      })

      // Create positions for a 10-minute run covering ~2 km
      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(startTime.getTime()),
          accuracy: 10,
        },
        {
          latitude: 40.7228,
          longitude: -74.0060,
          timestamp: new Date(startTime.getTime() + 600000), // 10 minutes later
          accuracy: 10,
        },
      ]

      const updatedRoute = await RouteService.addPositions(route.id, testUserId, positions)

      // Average speed should be around 12 km/h (2 km in 10 minutes)
      expect(updatedRoute.averageSpeed).toBeGreaterThan(10)
      expect(updatedRoute.averageSpeed).toBeLessThan(15)
    })

    it('should retrieve route metrics', async () => {
      const startTime = new Date()
      const route = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime,
      })

      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(startTime.getTime()),
          accuracy: 10,
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date(startTime.getTime() + 120000), // 2 minutes later
          accuracy: 10,
        },
      ]

      await RouteService.addPositions(route.id, testUserId, positions)

      const metrics = await RouteService.getRouteMetrics(route.id)

      expect(metrics).toBeDefined()
      expect(metrics.totalDistance).toBeGreaterThan(0)
      expect(metrics.averageSpeed).toBeGreaterThan(0)
      expect(metrics.duration).toBe(120)
      expect(metrics.elapsedTime).toBe(120)
    })
  })

  describe('Route History', () => {
    it('should retrieve user route history', async () => {
      // Create multiple routes
      const route1 = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime: new Date(),
      })

      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10,
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date(Date.now() + 60000),
          accuracy: 10,
        },
      ]

      await RouteService.addPositions(route1.id, testUserId, positions)

      // Get route history
      const result = await RouteService.getUserRoutes(testUserId, 1, 10)

      expect(result).toBeDefined()
      expect(result.routes).toBeDefined()
      expect(result.routes.length).toBeGreaterThan(0)
      expect(result.total).toBeGreaterThan(0)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBeGreaterThan(0)
    })

    it('should include activity information in route history', async () => {
      const route = await RouteService.createRoute(testUserId, {
        activityId: testActivityId,
        startTime: new Date(),
      })

      const positions: GPSPosition[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10,
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date(Date.now() + 60000),
          accuracy: 10,
        },
      ]

      await RouteService.addPositions(route.id, testUserId, positions)

      const result = await RouteService.getUserRoutes(testUserId, 1, 10)

      expect(result.routes[0].activity).toBeDefined()
      expect(result.routes[0].activity.id).toBe(testActivityId)
      expect(result.routes[0].activity.title).toBe('Test Run')
    })

    it('should paginate route history correctly', async () => {
      // Create multiple routes
      for (let i = 0; i < 3; i++) {
        const route = await RouteService.createRoute(testUserId, {
          activityId: testActivityId,
          startTime: new Date(),
        })

        const positions: GPSPosition[] = [
          {
            latitude: 40.7128,
            longitude: -74.0060,
            timestamp: new Date(),
            accuracy: 10,
          },
          {
            latitude: 40.7138,
            longitude: -74.0070,
            timestamp: new Date(Date.now() + 60000),
            accuracy: 10,
          },
        ]

        await RouteService.addPositions(route.id, testUserId, positions)
      }

      // Get first page with limit 2
      const page1 = await RouteService.getUserRoutes(testUserId, 1, 2)
      expect(page1.routes.length).toBe(2)
      expect(page1.total).toBe(3)
      expect(page1.totalPages).toBe(2)

      // Get second page
      const page2 = await RouteService.getUserRoutes(testUserId, 2, 2)
      expect(page2.routes.length).toBe(1)
      expect(page2.total).toBe(3)
    })
  })
})
