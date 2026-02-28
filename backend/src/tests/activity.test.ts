import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { activityService } from '../services/activity.service.js'
import { authService } from '../services/auth.service.js'
import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'
import { CreateActivityRequest } from '../types/activity.types.js'

describe('Activity Service', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testUser3Id: string
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
    // Clean up test data before each test
    try {
      await db.query("DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%'")
    } catch (error) {
      console.error('Cleanup error:', error)
    }

    // Create test users
    const user1 = await authService.register({
      email: 'user1@test.com',
      password: 'password123',
      displayName: 'Test User One',
      age: 25,
      agreedToTerms: true,
    })
    testUser1Id = user1.id

    const user2 = await authService.register({
      email: 'user2@test.com',
      password: 'password123',
      displayName: 'Test User Two',
      age: 30,
      agreedToTerms: true,
    })
    testUser2Id = user2.id

    const user3 = await authService.register({
      email: 'user3@test.com',
      password: 'password123',
      displayName: 'Test User Three',
      age: 35,
      agreedToTerms: true,
    })
    testUser3Id = user3.id
  })

  describe('Activity Creation', () => {
    it('should create a new activity', async () => {
      const activityData: CreateActivityRequest = {
        title: 'Morning Run',
        description: 'A nice morning run in the park',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        route: 'Main loop',
        distance: 5.0,
        maxParticipants: 10,
      }

      const activity = await activityService.createActivity(testUser1Id, activityData)

      expect(activity).toBeDefined()
      expect(activity.id).toBeDefined()
      expect(activity.creatorId).toBe(testUser1Id)
      expect(activity.creatorName).toBe('Test User One')
      expect(activity.title).toBe('Morning Run')
      expect(activity.description).toBe('A nice morning run in the park')
      expect(activity.distance).toBe(5.0)
      expect(activity.maxParticipants).toBe(10)
      expect(activity.currentParticipants).toBe(0)
      expect(activity.status).toBe('upcoming')

      testActivityId = activity.id

      // Verify chat room was created
      const chatRoomResult = await db.query(
        'SELECT * FROM chat_rooms WHERE activity_id = $1',
        [activity.id]
      )
      expect(chatRoomResult.rows.length).toBe(1)
    })

    it('should reject activity without title', async () => {
      const activityData: CreateActivityRequest = {
        title: '',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }

      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow('Title is required')
    })

    it('should reject activity with past scheduled date', async () => {
      const activityData: CreateActivityRequest = {
        title: 'Past Run',
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }

      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow('Scheduled date must be in the future')
    })

    it('should reject activity with invalid distance', async () => {
      const activityData: CreateActivityRequest = {
        title: 'Invalid Run',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 0,
        maxParticipants: 10,
      }

      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow('Distance must be greater than 0')
    })

    it('should reject activity with invalid max participants', async () => {
      const activityData: CreateActivityRequest = {
        title: 'Invalid Run',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 0,
      }

      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createActivity(testUser1Id, activityData)
      ).rejects.toThrow('Maximum participants must be greater than 0')
    })
  })

  describe('Activity Retrieval', () => {
    beforeEach(async () => {
      // Create a test activity
      const activityData: CreateActivityRequest = {
        title: 'Test Activity',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }
      const activity = await activityService.createActivity(testUser1Id, activityData)
      testActivityId = activity.id
    })

    it('should get activity by ID', async () => {
      const activity = await activityService.getActivityById(testActivityId)

      expect(activity).toBeDefined()
      expect(activity.id).toBe(testActivityId)
      expect(activity.title).toBe('Test Activity')
      expect(activity.participants).toBeDefined()
      expect(activity.participants).toHaveLength(0)
    })

    it('should throw error for non-existent activity', async () => {
      const fakeActivityId = '00000000-0000-0000-0000-000000000000'

      await expect(
        activityService.getActivityById(fakeActivityId)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.getActivityById(fakeActivityId)
      ).rejects.toThrow('Activity not found')
    })
  })

  describe('Activity Updates', () => {
    beforeEach(async () => {
      // Create a test activity scheduled for 2 hours from now
      const activityData: CreateActivityRequest = {
        title: 'Test Activity',
        scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }
      const activity = await activityService.createActivity(testUser1Id, activityData)
      testActivityId = activity.id
    })

    it('should update activity title', async () => {
      const updated = await activityService.updateActivity(testActivityId, testUser1Id, {
        title: 'Updated Title',
      })

      expect(updated.title).toBe('Updated Title')
    })

    it('should update activity distance', async () => {
      const updated = await activityService.updateActivity(testActivityId, testUser1Id, {
        distance: 10.0,
      })

      expect(updated.distance).toBe(10.0)
    })

    it('should prevent non-creator from updating activity', async () => {
      await expect(
        activityService.updateActivity(testActivityId, testUser2Id, {
          title: 'Hacked Title',
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.updateActivity(testActivityId, testUser2Id, {
          title: 'Hacked Title',
        })
      ).rejects.toThrow('Only the activity creator can update this activity')
    })

    it('should enforce 1-hour edit deadline', async () => {
      // Create activity scheduled for 30 minutes from now
      const activityData: CreateActivityRequest = {
        title: 'Soon Activity',
        scheduledDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }
      const activity = await activityService.createActivity(testUser1Id, activityData)

      await expect(
        activityService.updateActivity(activity.id, testUser1Id, {
          title: 'Updated Title',
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.updateActivity(activity.id, testUser1Id, {
          title: 'Updated Title',
        })
      ).rejects.toThrow('Cannot edit activity within 1 hour of scheduled start time')
    })

    it('should prevent updating cancelled activity', async () => {
      // Cancel the activity first
      await activityService.cancelActivity(testActivityId, testUser1Id)

      await expect(
        activityService.updateActivity(testActivityId, testUser1Id, {
          title: 'Updated Title',
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.updateActivity(testActivityId, testUser1Id, {
          title: 'Updated Title',
        })
      ).rejects.toThrow('Cannot update a cancelled activity')
    })
  })

  describe('Activity Cancellation', () => {
    beforeEach(async () => {
      const activityData: CreateActivityRequest = {
        title: 'Test Activity',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }
      const activity = await activityService.createActivity(testUser1Id, activityData)
      testActivityId = activity.id
    })

    it('should cancel activity', async () => {
      await activityService.cancelActivity(testActivityId, testUser1Id)

      const activity = await activityService.getActivityById(testActivityId)
      expect(activity.status).toBe('cancelled')
    })

    it('should prevent non-creator from cancelling activity', async () => {
      await expect(
        activityService.cancelActivity(testActivityId, testUser2Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.cancelActivity(testActivityId, testUser2Id)
      ).rejects.toThrow('Only the activity creator can cancel this activity')
    })

    it('should prevent cancelling already cancelled activity', async () => {
      await activityService.cancelActivity(testActivityId, testUser1Id)

      await expect(
        activityService.cancelActivity(testActivityId, testUser1Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.cancelActivity(testActivityId, testUser1Id)
      ).rejects.toThrow('Activity is already cancelled')
    })
  })

  describe('Activity Participation', () => {
    beforeEach(async () => {
      const activityData: CreateActivityRequest = {
        title: 'Test Activity',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 2,
      }
      const activity = await activityService.createActivity(testUser1Id, activityData)
      testActivityId = activity.id
    })

    it('should join activity', async () => {
      await activityService.joinActivity(testActivityId, testUser2Id)

      const activity = await activityService.getActivityById(testActivityId)
      expect(activity.currentParticipants).toBe(1)
      expect(activity.participants).toHaveLength(1)
      expect(activity.participants[0].userId).toBe(testUser2Id)
    })

    it('should prevent duplicate joins', async () => {
      await activityService.joinActivity(testActivityId, testUser2Id)

      await expect(
        activityService.joinActivity(testActivityId, testUser2Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.joinActivity(testActivityId, testUser2Id)
      ).rejects.toThrow('Already joined this activity')
    })

    it('should enforce maximum capacity', async () => {
      // Join with user2 and user3 (max is 2)
      await activityService.joinActivity(testActivityId, testUser2Id)
      await activityService.joinActivity(testActivityId, testUser3Id)

      // Try to join with another user (should fail)
      const user4 = await authService.register({
        email: 'user4@test.com',
        password: 'password123',
        displayName: 'Test User Four',
        age: 28,
        agreedToTerms: true,
      })

      await expect(
        activityService.joinActivity(testActivityId, user4.id)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.joinActivity(testActivityId, user4.id)
      ).rejects.toThrow('Activity is full')
    })

    it('should prevent joining cancelled activity', async () => {
      await activityService.cancelActivity(testActivityId, testUser1Id)

      await expect(
        activityService.joinActivity(testActivityId, testUser2Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.joinActivity(testActivityId, testUser2Id)
      ).rejects.toThrow('Cannot join a cancelled activity')
    })

    it('should leave activity', async () => {
      await activityService.joinActivity(testActivityId, testUser2Id)
      await activityService.leaveActivity(testActivityId, testUser2Id)

      const activity = await activityService.getActivityById(testActivityId)
      expect(activity.currentParticipants).toBe(0)
      expect(activity.participants).toHaveLength(0)
    })

    it('should prevent leaving if not a participant', async () => {
      await expect(
        activityService.leaveActivity(testActivityId, testUser2Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.leaveActivity(testActivityId, testUser2Id)
      ).rejects.toThrow('Not a participant of this activity')
    })

    it('should enforce 1-hour leave deadline', async () => {
      // Create activity scheduled for 30 minutes from now
      const activityData: CreateActivityRequest = {
        title: 'Soon Activity',
        scheduledDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }
      const activity = await activityService.createActivity(testUser1Id, activityData)

      // Join the activity
      await activityService.joinActivity(activity.id, testUser2Id)

      // Try to leave (should fail due to 1-hour deadline)
      await expect(
        activityService.leaveActivity(activity.id, testUser2Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.leaveActivity(activity.id, testUser2Id)
      ).rejects.toThrow('Cannot leave activity within 1 hour of scheduled start time')
    })
  })

  describe('Activity Search and Filtering', () => {
    beforeEach(async () => {
      // Create multiple test activities
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await activityService.createActivity(testUser1Id, {
        title: 'Short Run',
        scheduledDate: tomorrow.toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 3.0,
        maxParticipants: 5,
      })

      await activityService.createActivity(testUser1Id, {
        title: 'Long Run',
        scheduledDate: nextWeek.toISOString(),
        latitude: 40.7589,
        longitude: -73.9851,
        address: 'Times Square, New York',
        distance: 10.0,
        maxParticipants: 10,
      })

      await activityService.createActivity(testUser2Id, {
        title: 'Medium Run',
        scheduledDate: tomorrow.toISOString(),
        latitude: 34.0522,
        longitude: -118.2437,
        address: 'Los Angeles, CA',
        distance: 5.0,
        maxParticipants: 8,
      })
    })

    it('should search all upcoming activities', async () => {
      const { activities, total } = await activityService.searchActivities({})

      expect(total).toBe(3)
      expect(activities).toHaveLength(3)
    })

    it('should filter by distance range', async () => {
      const { activities, total } = await activityService.searchActivities({
        minDistance: 5.0,
        maxDistance: 10.0,
      })

      expect(total).toBe(2)
      expect(activities.every(a => a.distance >= 5.0 && a.distance <= 10.0)).toBe(true)
    })

    it('should filter by date range', async () => {
      const now = new Date()
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)

      const { activities, total } = await activityService.searchActivities({
        startDate: now.toISOString(),
        endDate: twoDaysFromNow.toISOString(),
      })

      expect(total).toBe(2) // Should find 2 activities scheduled for tomorrow
    })

    it('should search nearby activities', async () => {
      // Search near Central Park (40.7128, -74.0060)
      const { activities } = await activityService.searchActivities({
        latitude: 40.7128,
        longitude: -74.006,
        radius: 10, // 10 km radius
      })

      // Should find activities in New York but not Los Angeles
      expect(activities.length).toBeGreaterThan(0)
      expect(activities.every(a => 
        Math.abs(a.latitude - 40.7128) < 1 && Math.abs(a.longitude + 74.006) < 1
      )).toBe(true)
    })

    it('should paginate results', async () => {
      const { activities, total } = await activityService.searchActivities({}, 1, 2)

      expect(total).toBe(3)
      expect(activities).toHaveLength(2)
    })

    it('should filter by keyword in title', async () => {
      const { activities, total } = await activityService.searchActivities({
        keyword: 'Short',
      })

      expect(total).toBe(1)
      expect(activities[0].title).toBe('Short Run')
    })

    it('should filter by keyword in description', async () => {
      const shortRun = (await activityService.searchActivities({ keyword: 'Short' })).activities[0]
      await activityService.updateActivity(shortRun.id, testUser1Id, {
        description: 'A quick morning jog in the park',
      })

      const { activities, total } = await activityService.searchActivities({
        keyword: 'morning',
      })

      expect(total).toBeGreaterThanOrEqual(1)
      expect(activities.some(a => a.description?.toLowerCase().includes('morning'))).toBe(true)
    })

    it('should filter by keyword in address', async () => {
      const { activities, total } = await activityService.searchActivities({
        keyword: 'Los Angeles',
      })

      expect(total).toBe(1)
      expect(activities[0].address).toContain('Los Angeles')
    })
  })

  describe('Activity Bookmarks', () => {
    beforeEach(async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const activity = await activityService.createActivity(testUser1Id, {
        title: 'Bookmark Test Run',
        scheduledDate: tomorrow.toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      })
      testActivityId = activity.id
    })

    it('should bookmark an activity', async () => {
      await activityService.bookmarkActivity(testUser2Id, testActivityId)

      const ids = await activityService.getBookmarkedActivityIds(testUser2Id)
      expect(ids).toContain(testActivityId)
    })

    it('should unbookmark an activity', async () => {
      await activityService.bookmarkActivity(testUser2Id, testActivityId)
      await activityService.unbookmarkActivity(testUser2Id, testActivityId)

      const ids = await activityService.getBookmarkedActivityIds(testUser2Id)
      expect(ids).not.toContain(testActivityId)
    })

    it('should throw when bookmarking non-existent activity', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      await expect(
        activityService.bookmarkActivity(testUser2Id, fakeId)
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.bookmarkActivity(testUser2Id, fakeId)
      ).rejects.toThrow('Activity not found')
    })

    it('should return bookmarked activities for user', async () => {
      await activityService.bookmarkActivity(testUser2Id, testActivityId)

      const activities = await activityService.getBookmarkedActivities(testUser2Id)
      expect(activities).toHaveLength(1)
      expect(activities[0].id).toBe(testActivityId)
      expect(activities[0].title).toBe('Bookmark Test Run')
    })

    it('should return empty array when user has no bookmarks', async () => {
      const ids = await activityService.getBookmarkedActivityIds(testUser2Id)
      expect(ids).toEqual([])
    })

    it('should check isBookmarked correctly', async () => {
      expect(await activityService.isBookmarked(testUser2Id, testActivityId)).toBe(false)
      await activityService.bookmarkActivity(testUser2Id, testActivityId)
      expect(await activityService.isBookmarked(testUser2Id, testActivityId)).toBe(true)
    })
  })

  describe('Activity Ratings', () => {
    beforeEach(async () => {
      // Create a test activity
      const activityData: CreateActivityRequest = {
        title: 'Test Activity',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }
      const activity = await activityService.createActivity(testUser1Id, activityData)
      testActivityId = activity.id

      // Have user2 and user3 join the activity
      await activityService.joinActivity(testActivityId, testUser2Id)
      await activityService.joinActivity(testActivityId, testUser3Id)
    })

    it('should create a rating for an activity', async () => {
      const rating = await activityService.createRating(testActivityId, testUser2Id, {
        rating: 5,
        feedback: 'Great run!',
      })

      expect(rating).toBeDefined()
      expect(rating.id).toBeDefined()
      expect(rating.activityId).toBe(testActivityId)
      expect(rating.userId).toBe(testUser2Id)
      expect(rating.userName).toBe('Test User Two')
      expect(rating.rating).toBe(5)
      expect(rating.feedback).toBe('Great run!')
    })

    it('should reject rating with invalid value', async () => {
      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 0,
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 0,
        })
      ).rejects.toThrow('Rating must be between 1 and 5 stars')

      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 6,
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 6,
        })
      ).rejects.toThrow('Rating must be between 1 and 5 stars')
    })

    it('should reject rating with feedback exceeding 500 characters', async () => {
      const longFeedback = 'a'.repeat(501)

      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 5,
          feedback: longFeedback,
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 5,
          feedback: longFeedback,
        })
      ).rejects.toThrow('Feedback must not exceed 500 characters')
    })

    it('should prevent non-participants from rating', async () => {
      // Create another user who is not a participant
      const user4 = await authService.register({
        email: 'user4@test.com',
        password: 'password123',
        displayName: 'Test User Four',
        age: 28,
        agreedToTerms: true,
      })

      await expect(
        activityService.createRating(testActivityId, user4.id, {
          rating: 5,
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createRating(testActivityId, user4.id, {
          rating: 5,
        })
      ).rejects.toThrow('Only participants can rate an activity')
    })

    it('should prevent duplicate ratings from same user', async () => {
      // Create first rating
      await activityService.createRating(testActivityId, testUser2Id, {
        rating: 5,
      })

      // Try to create second rating
      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 4,
        })
      ).rejects.toThrow(ValidationError)
      await expect(
        activityService.createRating(testActivityId, testUser2Id, {
          rating: 4,
        })
      ).rejects.toThrow('You have already rated this activity')
    })

    it('should get ratings for an activity', async () => {
      // Create multiple ratings
      await activityService.createRating(testActivityId, testUser2Id, {
        rating: 5,
        feedback: 'Excellent!',
      })

      await activityService.createRating(testActivityId, testUser3Id, {
        rating: 4,
        feedback: 'Good run',
      })

      const ratingSummary = await activityService.getActivityRatings(testActivityId)

      expect(ratingSummary).toBeDefined()
      expect(ratingSummary.averageRating).toBe(4.5)
      expect(ratingSummary.ratingCount).toBe(2)
      expect(ratingSummary.ratings).toHaveLength(2)
      expect(ratingSummary.ratings[0].rating).toBeDefined()
      expect(ratingSummary.ratings[0].userName).toBeDefined()
    })

    it('should calculate average rating correctly', async () => {
      // Create ratings: 5, 4, 3 -> average = 4.0
      await activityService.createRating(testActivityId, testUser2Id, {
        rating: 5,
      })

      await activityService.createRating(testActivityId, testUser3Id, {
        rating: 4,
      })

      // Create another user and have them join and rate
      const user4 = await authService.register({
        email: 'user4@test.com',
        password: 'password123',
        displayName: 'Test User Four',
        age: 28,
        agreedToTerms: true,
      })
      await activityService.joinActivity(testActivityId, user4.id)
      await activityService.createRating(testActivityId, user4.id, {
        rating: 3,
      })

      const ratingSummary = await activityService.getActivityRatings(testActivityId)

      expect(ratingSummary.averageRating).toBe(4.0)
      expect(ratingSummary.ratingCount).toBe(3)
    })

    it('should return zero average for activity with no ratings', async () => {
      const ratingSummary = await activityService.getActivityRatings(testActivityId)

      expect(ratingSummary.averageRating).toBe(0)
      expect(ratingSummary.ratingCount).toBe(0)
      expect(ratingSummary.ratings).toHaveLength(0)
    })

    it('should get user average rating as activity creator', async () => {
      // Create another activity by user1
      const activityData2: CreateActivityRequest = {
        title: 'Second Activity',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park, New York',
        distance: 5.0,
        maxParticipants: 10,
      }
      const activity2 = await activityService.createActivity(testUser1Id, activityData2)

      // Have users join both activities
      await activityService.joinActivity(activity2.id, testUser2Id)
      await activityService.joinActivity(activity2.id, testUser3Id)

      // Rate first activity: 5, 4 -> average = 4.5
      await activityService.createRating(testActivityId, testUser2Id, {
        rating: 5,
      })
      await activityService.createRating(testActivityId, testUser3Id, {
        rating: 4,
      })

      // Rate second activity: 3, 5 -> average = 4.0
      await activityService.createRating(activity2.id, testUser2Id, {
        rating: 3,
      })
      await activityService.createRating(activity2.id, testUser3Id, {
        rating: 5,
      })

      // Overall average for user1 as creator: (5 + 4 + 3 + 5) / 4 = 4.25 -> 4.3
      const userRating = await activityService.getUserAverageRating(testUser1Id)

      expect(userRating.averageRating).toBe(4.3) // Rounded to 1 decimal
      expect(userRating.ratingCount).toBe(4)
    })

    it('should return zero for user with no ratings', async () => {
      const userRating = await activityService.getUserAverageRating(testUser2Id)

      expect(userRating.averageRating).toBe(0)
      expect(userRating.ratingCount).toBe(0)
    })
  })
})
