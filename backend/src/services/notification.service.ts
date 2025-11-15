import { db } from '../database/db.js'
import { 
  Notification, 
  CreateNotificationRequest, 
  NotificationListResponse 
} from '../types/notification.types.js'

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        user_id as "userId",
        type,
        title,
        message,
        related_id as "relatedId",
        is_read as "isRead",
        created_at as "createdAt"
    `

    const values = [
      data.userId,
      data.type,
      data.title,
      data.message,
      data.relatedId || null,
    ]

    const result = await db.query(query, values)
    return result.rows[0]
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<NotificationListResponse> {
    // Get notifications
    const notificationsQuery = `
      SELECT 
        id,
        user_id as "userId",
        type,
        title,
        message,
        related_id as "relatedId",
        is_read as "isRead",
        created_at as "createdAt"
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `

    const notificationsResult = await db.query(notificationsQuery, [userId, limit, offset])

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications
      WHERE user_id = $1
    `

    const countResult = await db.query(countQuery, [userId])
    const total = parseInt(countResult.rows[0].total)

    // Get unread count
    const unreadQuery = `
      SELECT COUNT(*) as unread
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `

    const unreadResult = await db.query(unreadQuery, [userId])
    const unreadCount = parseInt(unreadResult.rows[0].unread)

    return {
      notifications: notificationsResult.rows,
      total,
      unreadCount,
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING 
        id,
        user_id as "userId",
        type,
        title,
        message,
        related_id as "relatedId",
        is_read as "isRead",
        created_at as "createdAt"
    `

    const result = await db.query(query, [notificationId, userId])
    return result.rows[0] || null
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
      RETURNING id
    `

    const result = await db.query(query, [userId])
    return result.rows.length
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `

    const result = await db.query(query, [notificationId, userId])
    return result.rows.length > 0
  }

  /**
   * Send notification when user joins activity
   */
  async notifyActivityJoined(activityId: string, creatorId: string, joinerName: string): Promise<void> {
    await this.createNotification({
      userId: creatorId,
      type: 'activity_joined',
      title: 'New Participant',
      message: `${joinerName} has joined your activity`,
      relatedId: activityId,
    })
  }

  /**
   * Send notification when activity is cancelled
   */
  async notifyActivityCancelled(activityId: string, participantIds: string[], activityTitle: string): Promise<void> {
    const notifications = participantIds.map(userId => 
      this.createNotification({
        userId,
        type: 'activity_cancelled',
        title: 'Activity Cancelled',
        message: `The activity "${activityTitle}" has been cancelled`,
        relatedId: activityId,
      })
    )

    await Promise.all(notifications)
  }

  /**
   * Send notification for new chat message
   */
  async notifyNewMessage(
    activityId: string, 
    participantIds: string[], 
    senderName: string,
    senderId: string
  ): Promise<void> {
    // Don't notify the sender
    const recipientIds = participantIds.filter(id => id !== senderId)

    const notifications = recipientIds.map(userId =>
      this.createNotification({
        userId,
        type: 'new_message',
        title: 'New Message',
        message: `${senderName} sent a message`,
        relatedId: activityId,
      })
    )

    await Promise.all(notifications)
  }

  /**
   * Send notification when user gains a follower
   */
  async notifyNewFollower(followedUserId: string, followerName: string, followerId: string): Promise<void> {
    await this.createNotification({
      userId: followedUserId,
      type: 'new_follower',
      title: 'New Follower',
      message: `${followerName} started following you`,
      relatedId: followerId,
    })
  }

  /**
   * Send activity reminder notifications
   */
  async sendActivityReminders(hoursBeforeStart: number): Promise<number> {
    // Find activities starting in the specified hours
    const query = `
      SELECT 
        a.id,
        a.title,
        a.scheduled_date,
        array_agg(ap.user_id) as participant_ids
      FROM activities a
      INNER JOIN activity_participants ap ON a.id = ap.activity_id
      WHERE 
        a.status = 'upcoming'
        AND a.scheduled_date > NOW()
        AND a.scheduled_date <= NOW() + INTERVAL '${hoursBeforeStart} hours'
        AND a.scheduled_date > NOW() + INTERVAL '${hoursBeforeStart - 1} hours'
      GROUP BY a.id, a.title, a.scheduled_date
    `

    const result = await db.query(query)
    const activities = result.rows

    let notificationCount = 0

    for (const activity of activities) {
      const participantIds = activity.participant_ids as string[]
      const title = hoursBeforeStart === 24 ? 'Activity Tomorrow' : 'Activity Starting Soon'
      const message = hoursBeforeStart === 24 
        ? `Reminder: "${activity.title}" starts tomorrow`
        : `Reminder: "${activity.title}" starts in 1 hour`

      const notifications = participantIds.map(userId =>
        this.createNotification({
          userId,
          type: 'activity_reminder',
          title,
          message,
          relatedId: activity.id,
        })
      )

      await Promise.all(notifications)
      notificationCount += participantIds.length
    }

    return notificationCount
  }
}

export const notificationService = new NotificationService()
