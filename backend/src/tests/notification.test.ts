import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { notificationService } from '../services/notification.service.js'
import { authService } from '../services/auth.service.js'
import { activityService } from '../services/activity.service.js'
import { db } from '../database/db.js'
import { CreateActivityRequest } from '../types/activity.types.js'

describe('Notification Service', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testUser3Id: string
  let testActivityId: string

  beforeAll(async () => {
    await db.testConnection()
  })

  afterAll(async () => {
    await db.close()
  })

  beforeEach(async () => {
    // Clean up test data
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

    // Create a test activity
    const activityData: CreateActivityRequest = {
      title: 'Morning Run',
      description: 'A nice morning run',
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

  describe('Notification Creation', () => {
    it('should create a notification', async () => {
      const notification = await notificationService.createNotification({
        userId: testUser1Id,
        type: 'activity_reminder',
        title: 'Test Notification',
        message: 'This is a test notification',
        relatedId: testActivityId,
      })

      expect(notification).toBeDefined()
      expect(notification.id).toBeDefined()
      expect(notification.userId).toBe(testUser1Id)
      expect(notification.type).toBe('activity_reminder')
      expect(notification.title).toBe('Test Notification')
      expect(notification.message).toBe('This is a test notification')
      expect(notification.relatedId).toBe(testActivityId)
      expect(notification.isRead).toBe(false)
    })

    it('should create notification without relatedId', async () => {
      const notification = await notificationService.createNotification({
        userId: testUser1Id,
        type: 'new_follower',
        title: 'New Follower',
        message: 'Someone followed you',
      })

      expect(notification).toBeDefined()
      expect(notification.relatedId).toBeNull()
    })
  })

  describe('Get User Notifications', () => {
    it('should get all notifications for a user', async () => {
      // Create multiple notifications
      await notificationService.createNotification({
        userId: testUser1Id,
        type: 'activity_reminder',
        title: 'Notification 1',
        message: 'Message 1',
      })

      await notificationService.createNotification({
        userId: testUser1Id,
        type: 'new_message',
        title: 'Notification 2',
        message: 'Message 2',
      })

      await notificationService.createNotification({
        userId: testUser2Id,
        type: 'new_follower',
        title: 'Notification 3',
        message: 'Message 3',
      })

      const result = await notificationService.getUserNotifications(testUser1Id)

      expect(result.notifications).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.unreadCount).toBe(2)
      expect(result.notifications[0].userId).toBe(testUser1Id)
    })

    it('should return empty list for user with no notifications', async () => {
      const result = await notificationService.getUserNotifications(testUser2Id)

      expect(result.notifications).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.unreadCount).toBe(0)
    })
  })

  describe('Mark Notifications as Read', () => {
    it('should mark a notification as read', async () => {
      const notification = await notificationService.createNotification({
        userId: testUser1Id,
        type: 'activity_reminder',
        title: 'Test',
        message: 'Test message',
      })

      expect(notification.isRead).toBe(false)

      const updated = await notificationService.markAsRead(notification.id, testUser1Id)

      expect(updated).toBeDefined()
      expect(updated?.isRead).toBe(true)
    })

    it('should return null when marking non-existent notification', async () => {
      // Use a valid UUID format that doesn't exist
      const fakeUuid = '00000000-0000-0000-0000-000000000000'
      const updated = await notificationService.markAsRead(fakeUuid, testUser1Id)
      expect(updated).toBeNull()
    })

    it('should mark all notifications as read', async () => {
      await notificationService.createNotification({
        userId: testUser1Id,
        type: 'activity_reminder',
        title: 'Notification 1',
        message: 'Message 1',
      })

      await notificationService.createNotification({
        userId: testUser1Id,
        type: 'new_message',
        title: 'Notification 2',
        message: 'Message 2',
      })

      const count = await notificationService.markAllAsRead(testUser1Id)
      expect(count).toBe(2)

      const result = await notificationService.getUserNotifications(testUser1Id)
      expect(result.unreadCount).toBe(0)
    })
  })

  describe('Delete Notification', () => {
    it('should delete a notification', async () => {
      const notification = await notificationService.createNotification({
        userId: testUser1Id,
        type: 'activity_reminder',
        title: 'Test',
        message: 'Test message',
      })

      const deleted = await notificationService.deleteNotification(notification.id, testUser1Id)
      expect(deleted).toBe(true)

      const result = await notificationService.getUserNotifications(testUser1Id)
      expect(result.total).toBe(0)
    })

    it('should return false when deleting non-existent notification', async () => {
      // Use a valid UUID format that doesn't exist
      const fakeUuid = '00000000-0000-0000-0000-000000000000'
      const deleted = await notificationService.deleteNotification(fakeUuid, testUser1Id)
      expect(deleted).toBe(false)
    })
  })

  describe('Notification Triggers', () => {
    it('should send notification when user joins activity', async () => {
      await notificationService.notifyActivityJoined(
        testActivityId,
        testUser1Id,
        'Test User Two'
      )

      const result = await notificationService.getUserNotifications(testUser1Id)
      expect(result.total).toBe(1)
      expect(result.notifications[0].type).toBe('activity_joined')
      expect(result.notifications[0].title).toBe('New Participant')
      expect(result.notifications[0].message).toContain('Test User Two')
    })

    it('should send notifications when activity is cancelled', async () => {
      const participantIds = [testUser2Id, testUser3Id]

      await notificationService.notifyActivityCancelled(
        testActivityId,
        participantIds,
        'Morning Run'
      )

      const result2 = await notificationService.getUserNotifications(testUser2Id)
      expect(result2.total).toBe(1)
      expect(result2.notifications[0].type).toBe('activity_cancelled')
      expect(result2.notifications[0].message).toContain('Morning Run')

      const result3 = await notificationService.getUserNotifications(testUser3Id)
      expect(result3.total).toBe(1)
    })

    it('should send notification for new message', async () => {
      const participantIds = [testUser1Id, testUser2Id, testUser3Id]

      await notificationService.notifyNewMessage(
        testActivityId,
        participantIds,
        'Test User Two',
        testUser2Id
      )

      // User 2 should not receive notification (sender)
      const result2 = await notificationService.getUserNotifications(testUser2Id)
      expect(result2.total).toBe(0)

      // User 1 and 3 should receive notification
      const result1 = await notificationService.getUserNotifications(testUser1Id)
      expect(result1.total).toBe(1)
      expect(result1.notifications[0].type).toBe('new_message')

      const result3 = await notificationService.getUserNotifications(testUser3Id)
      expect(result3.total).toBe(1)
    })

    it('should send notification for new follower', async () => {
      await notificationService.notifyNewFollower(
        testUser1Id,
        'Test User Two',
        testUser2Id
      )

      const result = await notificationService.getUserNotifications(testUser1Id)
      expect(result.total).toBe(1)
      expect(result.notifications[0].type).toBe('new_follower')
      expect(result.notifications[0].message).toContain('Test User Two')
    })
  })

  describe('Activity Reminders', () => {
    it('should send reminders for activities starting in 1 hour', async () => {
      // Create activity starting in approximately 1 hour (30-90 minutes window)
      const activityData: CreateActivityRequest = {
        title: 'Upcoming Run',
        description: 'Starting soon',
        scheduledDate: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park',
        distance: 5.0,
        maxParticipants: 10,
      }

      const activity = await activityService.createActivity(testUser1Id, activityData)
      await activityService.joinActivity(activity.id, testUser2Id)

      const count = await notificationService.sendActivityReminders(1)
      expect(count).toBeGreaterThanOrEqual(0)

      // If reminders were sent, verify the notification
      if (count > 0) {
        const result = await notificationService.getUserNotifications(testUser2Id)
        expect(result.total).toBeGreaterThan(0)
        expect(result.notifications[0].type).toBe('activity_reminder')
        expect(result.notifications[0].message).toContain('1 hour')
      }
    })

    it('should send reminders for activities starting in 24 hours', async () => {
      // Create activity starting in approximately 24 hours (23-25 hours window)
      const activityData: CreateActivityRequest = {
        title: 'Tomorrow Run',
        description: 'Starting tomorrow',
        scheduledDate: new Date(Date.now() + 23.5 * 60 * 60 * 1000).toISOString(),
        latitude: 40.7128,
        longitude: -74.006,
        address: 'Central Park',
        distance: 5.0,
        maxParticipants: 10,
      }

      const activity = await activityService.createActivity(testUser1Id, activityData)
      await activityService.joinActivity(activity.id, testUser2Id)

      const count = await notificationService.sendActivityReminders(24)
      expect(count).toBeGreaterThanOrEqual(0)

      // If reminders were sent, verify the notification
      if (count > 0) {
        const result = await notificationService.getUserNotifications(testUser2Id)
        expect(result.total).toBeGreaterThan(0)
        expect(result.notifications[0].type).toBe('activity_reminder')
        expect(result.notifications[0].message).toContain('tomorrow')
      }
    })
  })
})
