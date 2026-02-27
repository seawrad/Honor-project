import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'
import {
  Activity,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityWithParticipants,
  ActivityParticipant,
  ActivitySearchFilters,
  ActivitySearchResult,
  ActivityRating,
  CreateRatingRequest,
  ActivityRatingSummary,
} from '../types/activity.types.js'
import { notificationService } from './notification.service.js'

function mapActivityRow(row: any, creatorName: string, currentParticipants: number): Activity {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorName,
    title: row.title,
    description: row.description || '',
    scheduledDate: row.scheduled_date.toISOString(),
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    address: row.address,
    route: row.route || '',
    distance: parseFloat(row.distance),
    maxParticipants: row.max_participants,
    currentParticipants,
    status: row.status,
    activityType: (row.activity_type || 'route-based') as Activity['activityType'],
    durationMinutes: row.duration_minutes != null ? parseInt(row.duration_minutes) : undefined,
    endLatitude: row.end_latitude != null ? parseFloat(row.end_latitude) : undefined,
    endLongitude: row.end_longitude != null ? parseFloat(row.end_longitude) : undefined,
    endAddress: row.end_address || undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

class ActivityService {
  /**
   * Create a new activity
   */
  async createActivity(creatorId: string, data: CreateActivityRequest): Promise<Activity> {
    try {
      // Validate required fields
      if (!data.title || data.title.trim().length === 0) {
        throw new ValidationError('Title is required', 'VALIDATION_REQUIRED_FIELD')
      }

      if (!data.scheduledDate) {
        throw new ValidationError('Scheduled date is required', 'VALIDATION_REQUIRED_FIELD')
      }

      if (data.latitude === undefined || data.longitude === undefined) {
        throw new ValidationError('Location is required', 'VALIDATION_REQUIRED_FIELD')
      }

      const activityType = data.activityType || 'route-based'

      if (activityType === 'time-based') {
        if (!data.durationMinutes || data.durationMinutes <= 0) {
          throw new ValidationError('Duration (minutes) is required for time-based activities', 'VALIDATION_REQUIRED_FIELD')
        }
      }

      if (!data.distance || data.distance <= 0) {
        throw new ValidationError('Distance must be greater than 0', 'VALIDATION_INVALID_FORMAT')
      }

      if (!data.maxParticipants || data.maxParticipants <= 0) {
        throw new ValidationError(
          'Maximum participants must be greater than 0',
          'VALIDATION_INVALID_FORMAT'
        )
      }

      // Validate scheduled date is in the future
      const scheduledDate = new Date(data.scheduledDate)
      if (isNaN(scheduledDate.getTime())) {
        throw new ValidationError('Invalid date format', 'VALIDATION_INVALID_FORMAT')
      }

      if (scheduledDate <= new Date()) {
        throw new ValidationError(
          'Scheduled date must be in the future',
          'VALIDATION_INVALID_FORMAT'
        )
      }

      // Insert activity
      const result = await db.query(
        `INSERT INTO activities (
          creator_id, title, description, scheduled_date,
          latitude, longitude, address, route, distance, max_participants,
          activity_type, duration_minutes, end_latitude, end_longitude, end_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id, creator_id, title, description, scheduled_date,
                  latitude, longitude, address, route, distance,
                  max_participants, status, activity_type, duration_minutes,
                  end_latitude, end_longitude, end_address,
                  created_at, updated_at`,
        [
          creatorId,
          data.title,
          data.description || null,
          scheduledDate,
          data.latitude,
          data.longitude,
          data.address,
          data.route || null,
          data.distance,
          data.maxParticipants,
          activityType,
          data.durationMinutes || null,
          data.endLatitude ?? null,
          data.endLongitude ?? null,
          data.endAddress || null,
        ]
      )

      const activity = result.rows[0]

      // Create chat room for the activity
      await db.query(
        'INSERT INTO chat_rooms (activity_id) VALUES ($1)',
        [activity.id]
      )

      // Get creator name
      const creatorResult = await db.query(
        'SELECT display_name FROM users WHERE id = $1',
        [creatorId]
      )

      return mapActivityRow(activity, creatorResult.rows[0].display_name, 0)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error creating activity:', error)
      throw new Error('Failed to create activity')
    }
  }

  /**
   * Get activity by ID
   */
  async getActivityById(activityId: string): Promise<ActivityWithParticipants> {
    try {
      // Get activity details
      const activityResult = await db.query(
        `SELECT a.*, u.display_name as creator_name
         FROM activities a
         JOIN users u ON a.creator_id = u.id
         WHERE a.id = $1`,
        [activityId]
      )

      if (activityResult.rows.length === 0) {
        throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
      }

      const activity = activityResult.rows[0]

      // Get participants
      const participantsResult = await db.query(
        `SELECT ap.user_id, u.display_name, ap.joined_at
         FROM activity_participants ap
         JOIN users u ON ap.user_id = u.id
         WHERE ap.activity_id = $1
         ORDER BY ap.joined_at`,
        [activityId]
      )

      const participants: ActivityParticipant[] = participantsResult.rows.map(r => ({
        userId: r.user_id,
        displayName: r.display_name,
        joinedAt: r.joined_at.toISOString(),
      }))

      return {
        ...mapActivityRow(activity, activity.creator_name, participants.length),
        participants,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error fetching activity:', error)
      throw new Error('Failed to fetch activity')
    }
  }

  /**
   * Update activity
   */
  async updateActivity(
    activityId: string,
    userId: string,
    updates: UpdateActivityRequest
  ): Promise<Activity> {
    try {
      // Get activity to check ownership and edit deadline
      const activityResult = await db.query(
        'SELECT creator_id, scheduled_date, status FROM activities WHERE id = $1',
        [activityId]
      )

      if (activityResult.rows.length === 0) {
        throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
      }

      const activity = activityResult.rows[0]

      // Check ownership
      if (activity.creator_id !== userId) {
        throw new ValidationError(
          'Only the activity creator can update this activity',
          'AUTH_FORBIDDEN'
        )
      }

      // Check if activity is cancelled
      if (activity.status === 'cancelled') {
        throw new ValidationError(
          'Cannot update a cancelled activity',
          'ACTIVITY_CANCELLED'
        )
      }

      // Check 1-hour edit deadline (skip for status-only updates)
      const isStatusOnlyUpdate = Object.keys(updates).length === 1 && updates.status !== undefined
      if (!isStatusOnlyUpdate) {
        const scheduledDate = new Date(activity.scheduled_date)
        const oneHourBeforeStart = new Date(scheduledDate.getTime() - 60 * 60 * 1000)

        if (new Date() >= oneHourBeforeStart) {
          throw new ValidationError(
            'Cannot edit activity within 1 hour of scheduled start time',
            'ACTIVITY_PAST_EDIT_DEADLINE'
          )
        }
      }

      // Validate updates
      if (updates.scheduledDate) {
        const newScheduledDate = new Date(updates.scheduledDate)
        if (isNaN(newScheduledDate.getTime())) {
          throw new ValidationError('Invalid date format', 'VALIDATION_INVALID_FORMAT')
        }
        if (newScheduledDate <= new Date()) {
          throw new ValidationError(
            'Scheduled date must be in the future',
            'VALIDATION_INVALID_FORMAT'
          )
        }
      }

      if (updates.distance !== undefined && updates.distance <= 0) {
        throw new ValidationError('Distance must be greater than 0', 'VALIDATION_INVALID_FORMAT')
      }

      if (updates.maxParticipants !== undefined && updates.maxParticipants <= 0) {
        throw new ValidationError(
          'Maximum participants must be greater than 0',
          'VALIDATION_INVALID_FORMAT'
        )
      }

      if (updates.status !== undefined) {
        const validTransitions: Record<string, string[]> = {
          upcoming: ['in-progress'],
          'in-progress': ['completed'],
        }
        const allowed = validTransitions[activity.status]
        if (!allowed || !allowed.includes(updates.status)) {
          throw new ValidationError(
            `Cannot change status from ${activity.status} to ${updates.status}`,
            'VALIDATION_INVALID_FORMAT'
          )
        }
      }

      // Build update query
      const updateFields: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (updates.title !== undefined) {
        updateFields.push(`title = $${paramCount}`)
        values.push(updates.title)
        paramCount++
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramCount}`)
        values.push(updates.description)
        paramCount++
      }

      if (updates.scheduledDate !== undefined) {
        updateFields.push(`scheduled_date = $${paramCount}`)
        values.push(new Date(updates.scheduledDate))
        paramCount++
      }

      if (updates.latitude !== undefined) {
        updateFields.push(`latitude = $${paramCount}`)
        values.push(updates.latitude)
        paramCount++
      }

      if (updates.longitude !== undefined) {
        updateFields.push(`longitude = $${paramCount}`)
        values.push(updates.longitude)
        paramCount++
      }

      if (updates.address !== undefined) {
        updateFields.push(`address = $${paramCount}`)
        values.push(updates.address)
        paramCount++
      }

      if (updates.route !== undefined) {
        updateFields.push(`route = $${paramCount}`)
        values.push(updates.route)
        paramCount++
      }

      if (updates.distance !== undefined) {
        updateFields.push(`distance = $${paramCount}`)
        values.push(updates.distance)
        paramCount++
      }

      if (updates.maxParticipants !== undefined) {
        updateFields.push(`max_participants = $${paramCount}`)
        values.push(updates.maxParticipants)
        paramCount++
      }

      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramCount}`)
        values.push(updates.status)
        paramCount++
      }

      if (updateFields.length === 0) {
        // No updates provided, return current activity
        const current = await this.getActivityById(activityId)
        return {
          ...current,
          participants: undefined,
        } as Activity
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(activityId)

      const query = `
        UPDATE activities
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id
      `

      await db.query(query, values)

      // Return updated activity
      const updated = await this.getActivityById(activityId)
      return {
        ...updated,
        participants: undefined,
      } as Activity
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error updating activity:', error)
      throw new Error('Failed to update activity')
    }
  }

  /**
   * Cancel activity (soft delete)
   */
  async cancelActivity(activityId: string, userId: string): Promise<void> {
    try {
      // Get activity to check ownership
      const activityResult = await db.query(
        'SELECT creator_id, status FROM activities WHERE id = $1',
        [activityId]
      )

      if (activityResult.rows.length === 0) {
        throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
      }

      const activity = activityResult.rows[0]

      // Check ownership
      if (activity.creator_id !== userId) {
        throw new ValidationError(
          'Only the activity creator can cancel this activity',
          'AUTH_FORBIDDEN'
        )
      }

      // Check if already cancelled
      if (activity.status === 'cancelled') {
        throw new ValidationError('Activity is already cancelled', 'ACTIVITY_CANCELLED')
      }

      // Get activity details and participants for notification
      const activityDetails = await this.getActivityById(activityId)
      const participantIds = activityDetails.participants.map(p => p.userId)

      // Update status to cancelled
      await db.query(
        'UPDATE activities SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['cancelled', activityId]
      )

      // Send cancellation notifications to all participants
      if (participantIds.length > 0) {
        await notificationService.notifyActivityCancelled(
          activityId,
          participantIds,
          activityDetails.title
        )
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error cancelling activity:', error)
      throw new Error('Failed to cancel activity')
    }
  }

  /**
   * Join an activity
   */
  async joinActivity(activityId: string, userId: string): Promise<void> {
    try {
      // Get activity details
      const activityResult = await db.query(
        `SELECT creator_id, max_participants, status, scheduled_date,
                (SELECT COUNT(*) FROM activity_participants WHERE activity_id = $1) as current_participants
         FROM activities
         WHERE id = $1`,
        [activityId]
      )

      if (activityResult.rows.length === 0) {
        throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
      }

      const activity = activityResult.rows[0]

      // Check if activity is cancelled
      if (activity.status === 'cancelled') {
        throw new ValidationError('Cannot join a cancelled activity', 'ACTIVITY_CANCELLED')
      }

      // Check if activity is in the past
      if (new Date(activity.scheduled_date) <= new Date()) {
        throw new ValidationError('Cannot join a past activity', 'ACTIVITY_PAST')
      }

      // Check if already joined
      const existingParticipant = await db.query(
        'SELECT * FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      )

      if (existingParticipant.rows.length > 0) {
        throw new ValidationError('Already joined this activity', 'ALREADY_JOINED')
      }

      // Check capacity
      const currentParticipants = parseInt(activity.current_participants)
      if (currentParticipants >= activity.max_participants) {
        throw new ValidationError('Activity is full', 'ACTIVITY_FULL')
      }

      // Add participant
      await db.query(
        'INSERT INTO activity_participants (activity_id, user_id) VALUES ($1, $2)',
        [activityId, userId]
      )

      // Get user display name for notification
      const userResult = await db.query(
        'SELECT display_name FROM users WHERE id = $1',
        [userId]
      )

      // Send notification to activity creator
      await notificationService.notifyActivityJoined(
        activityId,
        activity.creator_id,
        userResult.rows[0].display_name
      )
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error joining activity:', error)
      throw new Error('Failed to join activity')
    }
  }

  /**
   * Leave an activity
   */
  async leaveActivity(activityId: string, userId: string): Promise<void> {
    try {
      // Get activity details
      const activityResult = await db.query(
        'SELECT creator_id, scheduled_date, status FROM activities WHERE id = $1',
        [activityId]
      )

      if (activityResult.rows.length === 0) {
        throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
      }

      const activity = activityResult.rows[0]

      // Check if user is a participant
      const participantResult = await db.query(
        'SELECT * FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      )

      if (participantResult.rows.length === 0) {
        throw new ValidationError('Not a participant of this activity', 'NOT_PARTICIPANT')
      }

      // Check 1-hour leave deadline
      const scheduledDate = new Date(activity.scheduled_date)
      const oneHourBeforeStart = new Date(scheduledDate.getTime() - 60 * 60 * 1000)

      if (new Date() >= oneHourBeforeStart) {
        throw new ValidationError(
          'Cannot leave activity within 1 hour of scheduled start time',
          'ACTIVITY_PAST_LEAVE_DEADLINE'
        )
      }

      // Remove participant
      await db.query(
        'DELETE FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      )
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error leaving activity:', error)
      throw new Error('Failed to leave activity')
    }
  }

  /**
   * Search and filter activities
   */
  async searchActivities(
    filters: ActivitySearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<ActivitySearchResult> {
    const runSearch = (skipActivityType = false) => {
      const offset = (page - 1) * limit
      const conditions: string[] = []
      const values: any[] = []
      let paramCount = 1

      // Default to only upcoming activities
      conditions.push(`a.status = $${paramCount}`)
      values.push(filters.status || 'upcoming')
      paramCount++

      // Keyword search (title, description, address)
      if (filters.keyword && filters.keyword.trim()) {
        const searchPattern = `%${filters.keyword.trim().replace(/%/g, '\\%').replace(/_/g, '\\_')}%`
        conditions.push(`(
          a.title ILIKE $${paramCount} OR
          COALESCE(a.description, '') ILIKE $${paramCount} OR
          COALESCE(a.address, '') ILIKE $${paramCount}
        )`)
        values.push(searchPattern)
        paramCount++
      }

      // Date range filter
      if (filters.startDate) {
        conditions.push(`a.scheduled_date >= $${paramCount}`)
        values.push(new Date(filters.startDate))
        paramCount++
      }

      if (filters.endDate) {
        conditions.push(`a.scheduled_date <= $${paramCount}`)
        values.push(new Date(filters.endDate))
        paramCount++
      }

      // Distance filter
      if (filters.minDistance !== undefined) {
        conditions.push(`a.distance >= $${paramCount}`)
        values.push(filters.minDistance)
        paramCount++
      }

      if (filters.maxDistance !== undefined) {
        conditions.push(`a.distance <= $${paramCount}`)
        values.push(filters.maxDistance)
        paramCount++
      }

      if (filters.activityType && !skipActivityType) {
        conditions.push(`a.activity_type = $${paramCount}`)
        values.push(filters.activityType)
        paramCount++
      }

      return { conditions, values, paramCount, offset }
    }

    try {
      const { conditions, values, paramCount, offset } = runSearch(false)

      // Build base query
      let query = `
        SELECT 
          a.*,
          u.display_name as creator_name,
          (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as current_participants
      `

      // Add distance calculation if location provided
      if (filters.latitude !== undefined && filters.longitude !== undefined) {
        query += `,
          (6371 * acos(
            cos(radians($${paramCount})) * cos(radians(a.latitude)) *
            cos(radians(a.longitude) - radians($${paramCount + 1})) +
            sin(radians($${paramCount})) * sin(radians(a.latitude))
          )) as distance_from_user
        `
        values.push(filters.latitude, filters.longitude)
        paramCount += 2

        // Add radius filter if provided
        if (filters.radius !== undefined) {
          conditions.push(`(6371 * acos(
            cos(radians($${paramCount - 2})) * cos(radians(a.latitude)) *
            cos(radians(a.longitude) - radians($${paramCount - 1})) +
            sin(radians($${paramCount - 2})) * sin(radians(a.latitude))
          )) <= $${paramCount}`)
          values.push(filters.radius)
          paramCount++
        }
      }

      query += `
        FROM activities a
        JOIN users u ON a.creator_id = u.id
        WHERE ${conditions.join(' AND ')}
      `

      // Order by distance if location provided, otherwise by scheduled date
      if (filters.latitude !== undefined && filters.longitude !== undefined) {
        query += ' ORDER BY distance_from_user, a.scheduled_date'
      } else {
        query += ' ORDER BY a.scheduled_date'
      }

      // Add pagination
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`
      values.push(limit, offset)

      // Execute query (retry without activityType if column doesn't exist)
      let result: { rows: any[] }
      try {
        result = await db.query(query, values)
      } catch (queryErr: any) {
        const msg = String(queryErr?.message || '')
        if (
          filters.activityType &&
          (msg.includes('activity_type') || msg.includes('does not exist'))
        ) {
          const { activityType: _, ...filtersWithoutType } = filters
          return this.searchActivities(filtersWithoutType, page, limit)
        }
        throw queryErr
      }

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as count
        FROM activities a
        WHERE ${conditions.join(' AND ')}
      `
      const countValues = values.slice(0, -2) // Exclude limit and offset

      const countResult = await db.query(countQuery, countValues)
      const total = parseInt(countResult.rows[0].count)

      const activities: Activity[] = result.rows.map(row =>
        mapActivityRow(row, row.creator_name, parseInt(row.current_participants))
      )
      return { activities, total }
    } catch (error) {
      console.error('Error searching activities:', error)
      throw new Error('Failed to search activities')
    }
  }

  /**
   * Get activity feed for a user (activities from users they follow)
   */
  async getFeedForUser(userId: string, page: number = 1, limit: number = 20): Promise<ActivitySearchResult> {
    try {
      const offset = (page - 1) * limit
      const result = await db.query(
        `SELECT
          a.*,
          u.display_name as creator_name,
          (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as current_participants
        FROM activities a
        JOIN users u ON a.creator_id = u.id
        WHERE a.creator_id IN (
          SELECT following_id FROM social_connections WHERE follower_id = $1
        )
        AND a.status = 'upcoming'
        ORDER BY a.scheduled_date
        LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      )
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM activities a
         WHERE a.creator_id IN (
           SELECT following_id FROM social_connections WHERE follower_id = $1
         ) AND a.status = 'upcoming'`,
        [userId]
      )
      const total = parseInt(countResult.rows[0].count)
      const activities: Activity[] = result.rows.map(row =>
        mapActivityRow(row, row.creator_name, parseInt(row.current_participants))
      )
      return { activities, total }
    } catch (error) {
      console.error('Error getting feed:', error)
      throw new Error('Failed to get feed')
    }
  }

  /**
   * Create a rating for an activity
   */
  async createRating(
    activityId: string,
    userId: string,
    data: CreateRatingRequest
  ): Promise<ActivityRating> {
    try {
      // Validate rating value
      if (!data.rating || data.rating < 1 || data.rating > 5) {
        throw new ValidationError('Rating must be between 1 and 5 stars', 'VALIDATION_INVALID_FORMAT')
      }

      // Validate feedback length if provided
      if (data.feedback && data.feedback.length > 500) {
        throw new ValidationError('Feedback must not exceed 500 characters', 'VALIDATION_INVALID_FORMAT')
      }

      // Check if activity exists
      const activityResult = await db.query(
        'SELECT id, status FROM activities WHERE id = $1',
        [activityId]
      )

      if (activityResult.rows.length === 0) {
        throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
      }

      // Check if user was a participant
      const participantResult = await db.query(
        'SELECT * FROM activity_participants WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      )

      if (participantResult.rows.length === 0) {
        throw new ValidationError(
          'Only participants can rate an activity',
          'NOT_PARTICIPANT'
        )
      }

      // Check if user already rated this activity
      const existingRating = await db.query(
        'SELECT id FROM activity_ratings WHERE activity_id = $1 AND user_id = $2',
        [activityId, userId]
      )

      if (existingRating.rows.length > 0) {
        throw new ValidationError(
          'You have already rated this activity',
          'DUPLICATE_RATING'
        )
      }

      // Insert rating
      const result = await db.query(
        `INSERT INTO activity_ratings (activity_id, user_id, rating, feedback)
         VALUES ($1, $2, $3, $4)
         RETURNING id, activity_id, user_id, rating, feedback, created_at`,
        [activityId, userId, data.rating, data.feedback || null]
      )

      const rating = result.rows[0]

      // Get user name
      const userResult = await db.query(
        'SELECT display_name FROM users WHERE id = $1',
        [userId]
      )

      return {
        id: rating.id,
        activityId: rating.activity_id,
        userId: rating.user_id,
        userName: userResult.rows[0].display_name,
        rating: rating.rating,
        feedback: rating.feedback || undefined,
        createdAt: rating.created_at.toISOString(),
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error creating rating:', error)
      throw new Error('Failed to create rating')
    }
  }

  /**
   * Get ratings for an activity
   */
  async getActivityRatings(activityId: string): Promise<ActivityRatingSummary> {
    try {
      // Check if activity exists
      const activityResult = await db.query(
        'SELECT id FROM activities WHERE id = $1',
        [activityId]
      )

      if (activityResult.rows.length === 0) {
        throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
      }

      // Get all ratings for the activity
      const ratingsResult = await db.query(
        `SELECT ar.id, ar.activity_id, ar.user_id, ar.rating, ar.feedback, ar.created_at,
                u.display_name as user_name
         FROM activity_ratings ar
         JOIN users u ON ar.user_id = u.id
         WHERE ar.activity_id = $1
         ORDER BY ar.created_at DESC`,
        [activityId]
      )

      const ratings: ActivityRating[] = ratingsResult.rows.map(row => ({
        id: row.id,
        activityId: row.activity_id,
        userId: row.user_id,
        userName: row.user_name,
        rating: row.rating,
        feedback: row.feedback || undefined,
        createdAt: row.created_at.toISOString(),
      }))

      // Calculate average rating
      let averageRating = 0
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
        averageRating = Math.round((sum / ratings.length) * 10) / 10 // Round to 1 decimal
      }

      return {
        averageRating,
        ratingCount: ratings.length,
        ratings,
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error fetching activity ratings:', error)
      throw new Error('Failed to fetch activity ratings')
    }
  }

  /**
   * Get user's average rating as activity creator
   */
  async getUserAverageRating(userId: string): Promise<{ averageRating: number; ratingCount: number }> {
    try {
      const result = await db.query(
        `SELECT AVG(ar.rating) as average_rating, COUNT(ar.id) as rating_count
         FROM activity_ratings ar
         JOIN activities a ON ar.activity_id = a.id
         WHERE a.creator_id = $1`,
        [userId]
      )

      const averageRating = result.rows[0].average_rating
        ? Math.round(parseFloat(result.rows[0].average_rating) * 10) / 10
        : 0
      const ratingCount = parseInt(result.rows[0].rating_count) || 0

      return {
        averageRating,
        ratingCount,
      }
    } catch (error) {
      console.error('Error fetching user average rating:', error)
      throw new Error('Failed to fetch user average rating')
    }
  }

  /**
   * Bookmark an activity
   */
  async bookmarkActivity(userId: string, activityId: string): Promise<void> {
    const activity = await db.query('SELECT id FROM activities WHERE id = $1', [activityId])
    if (activity.rows.length === 0) {
      throw new ValidationError('Activity not found', 'ACTIVITY_NOT_FOUND')
    }
    await db.query(
      `INSERT INTO activity_bookmarks (user_id, activity_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, activity_id) DO NOTHING`,
      [userId, activityId]
    )
  }

  /**
   * Remove bookmark from an activity
   */
  async unbookmarkActivity(userId: string, activityId: string): Promise<void> {
    await db.query(
      'DELETE FROM activity_bookmarks WHERE user_id = $1 AND activity_id = $2',
      [userId, activityId]
    )
  }

  /**
   * Get bookmarked activity IDs for a user
   */
  async getBookmarkedActivityIds(userId: string): Promise<string[]> {
    const result = await db.query(
      'SELECT activity_id FROM activity_bookmarks WHERE user_id = $1',
      [userId]
    )
    return result.rows.map((r) => r.activity_id)
  }

  /**
   * Get bookmarked activities for a user
   */
  async getBookmarkedActivities(userId: string): Promise<Activity[]> {
    const result = await db.query(
      `SELECT a.*, u.display_name as creator_name,
        (SELECT COUNT(*) FROM activity_participants WHERE activity_id = a.id) as current_participants
       FROM activities a
       JOIN users u ON a.creator_id = u.id
       JOIN activity_bookmarks ab ON ab.activity_id = a.id AND ab.user_id = $1
       WHERE a.status != 'cancelled'
       ORDER BY ab.saved_at DESC`,
      [userId]
    )
    return result.rows.map((row) =>
      mapActivityRow(row, row.creator_name, parseInt(row.current_participants))
    )
  }

  /**
   * Check if user has bookmarked an activity
   */
  async isBookmarked(userId: string, activityId: string): Promise<boolean> {
    const result = await db.query(
      'SELECT 1 FROM activity_bookmarks WHERE user_id = $1 AND activity_id = $2',
      [userId, activityId]
    )
    return result.rows.length > 0
  }
}

export const activityService = new ActivityService()
