import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'
import { UserProfile, UpdateProfileRequest, UserStats, UserSearchResult } from '../types/user.types.js'
import { notificationService } from './notification.service.js'

class UserService {
  /**
   * Get user profile by ID with statistics
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Get user basic info
      const userResult = await db.query(
        `SELECT id, email, display_name, age, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [userId]
      )

      if (userResult.rows.length === 0) {
        throw new ValidationError('User not found', 'USER_NOT_FOUND')
      }

      const user = userResult.rows[0]

      // Get user statistics
      const stats = await this.getUserStats(userId)

      // Get followers and following counts
      const followersResult = await db.query(
        'SELECT COUNT(*) as count FROM social_connections WHERE following_id = $1',
        [userId]
      )

      const followingResult = await db.query(
        'SELECT COUNT(*) as count FROM social_connections WHERE follower_id = $1',
        [userId]
      )

      return {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        age: user.age,
        totalRuns: stats.totalRuns,
        totalDistance: stats.totalDistance,
        averageRating: stats.averageRating,
        followersCount: parseInt(followersResult.rows[0].count),
        followingCount: parseInt(followingResult.rows[0].count),
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString(),
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error fetching user profile:', error)
      throw new Error('Failed to fetch user profile')
    }
  }

  /**
   * Calculate user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get total runs (activities participated in that are completed)
      const runsResult = await db.query(
        `SELECT COUNT(*) as count
         FROM activity_participants ap
         JOIN activities a ON ap.activity_id = a.id
         WHERE ap.user_id = $1 AND a.status = 'completed'`,
        [userId]
      )

      // Get total distance from routes
      const distanceResult = await db.query(
        `SELECT COALESCE(SUM(total_distance), 0) as total
         FROM routes
         WHERE user_id = $1`,
        [userId]
      )

      // Get average rating for activities created by user
      const ratingResult = await db.query(
        `SELECT COALESCE(AVG(rating), 0) as average
         FROM activity_ratings ar
         JOIN activities a ON ar.activity_id = a.id
         WHERE a.creator_id = $1`,
        [userId]
      )

      return {
        totalRuns: parseInt(runsResult.rows[0].count),
        totalDistance: parseFloat(distanceResult.rows[0].total),
        averageRating: parseFloat(ratingResult.rows[0].average),
      }
    } catch (error) {
      console.error('Error calculating user stats:', error)
      throw new Error('Failed to calculate user statistics')
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<UserProfile> {
    try {
      // Validate updates
      if (updates.age !== undefined) {
        if (updates.age < 18 || updates.age > 65) {
          throw new ValidationError(
            'Age must be between 18 and 65 years',
            'VALIDATION_AGE_RESTRICTION'
          )
        }
      }

      if (updates.displayName !== undefined) {
        if (updates.displayName.trim().length === 0) {
          throw new ValidationError(
            'Display name cannot be empty',
            'VALIDATION_REQUIRED_FIELD'
          )
        }
      }

      // Build update query dynamically
      const updateFields: string[] = []
      const values: any[] = []
      let paramCount = 1

      if (updates.displayName !== undefined) {
        updateFields.push(`display_name = $${paramCount}`)
        values.push(updates.displayName)
        paramCount++
      }

      if (updates.age !== undefined) {
        updateFields.push(`age = $${paramCount}`)
        values.push(updates.age)
        paramCount++
      }

      if (updateFields.length === 0) {
        // No updates provided, just return current profile
        return this.getUserProfile(userId)
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      values.push(userId)

      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id
      `

      const result = await db.query(query, values)

      if (result.rows.length === 0) {
        throw new ValidationError('User not found', 'USER_NOT_FOUND')
      }

      // Return updated profile
      return this.getUserProfile(userId)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error updating user profile:', error)
      throw new Error('Failed to update user profile')
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [userId]
      )

      if (result.rows.length === 0) {
        throw new ValidationError('User not found', 'USER_NOT_FOUND')
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error deleting user account:', error)
      throw new Error('Failed to delete user account')
    }
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Prevent self-following
      if (followerId === followingId) {
        throw new ValidationError(
          'Cannot follow yourself',
          'VALIDATION_INVALID_OPERATION'
        )
      }

      // Check if following user exists
      const userExists = await db.query(
        'SELECT id FROM users WHERE id = $1',
        [followingId]
      )

      if (userExists.rows.length === 0) {
        throw new ValidationError('User not found', 'USER_NOT_FOUND')
      }

      // Check if already following
      const existingFollow = await db.query(
        'SELECT * FROM social_connections WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      )

      if (existingFollow.rows.length > 0) {
        throw new ValidationError(
          'Already following this user',
          'ALREADY_FOLLOWING'
        )
      }

      // Create follow relationship
      await db.query(
        'INSERT INTO social_connections (follower_id, following_id) VALUES ($1, $2)',
        [followerId, followingId]
      )

      // Get follower display name for notification
      const followerResult = await db.query(
        'SELECT display_name FROM users WHERE id = $1',
        [followerId]
      )

      // Send notification to the followed user
      await notificationService.notifyNewFollower(
        followingId,
        followerResult.rows[0].display_name,
        followerId
      )
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error following user:', error)
      throw new Error('Failed to follow user')
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM social_connections WHERE follower_id = $1 AND following_id = $2 RETURNING *',
        [followerId, followingId]
      )

      if (result.rows.length === 0) {
        throw new ValidationError(
          'Not following this user',
          'NOT_FOLLOWING'
        )
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      console.error('Error unfollowing user:', error)
      throw new Error('Failed to unfollow user')
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<{ users: UserSearchResult[], total: number }> {
    try {
      const offset = (page - 1) * limit

      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM social_connections WHERE following_id = $1',
        [userId]
      )

      const total = parseInt(countResult.rows[0].count)

      // Get followers with their stats
      const result = await db.query(
        `SELECT 
          u.id,
          u.display_name,
          COUNT(DISTINCT ap.activity_id) as total_runs,
          COALESCE(AVG(ar.rating), 0) as average_rating
         FROM users u
         JOIN social_connections sc ON u.id = sc.follower_id
         LEFT JOIN activity_participants ap ON u.id = ap.user_id
         LEFT JOIN activities a ON ap.activity_id = a.id AND a.status = 'completed'
         LEFT JOIN activity_ratings ar ON a.id = ar.activity_id AND a.creator_id = u.id
         WHERE sc.following_id = $1
         GROUP BY u.id, u.display_name
         ORDER BY u.display_name
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      )

      const users: UserSearchResult[] = result.rows.map(row => ({
        id: row.id,
        displayName: row.display_name,
        totalRuns: parseInt(row.total_runs),
        averageRating: parseFloat(row.average_rating),
        isFollowing: true, // They are followers, so we might be following them back
      }))

      return { users, total }
    } catch (error) {
      console.error('Error fetching followers:', error)
      throw new Error('Failed to fetch followers')
    }
  }

  /**
   * Get users that the user is following
   */
  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<{ users: UserSearchResult[], total: number }> {
    try {
      const offset = (page - 1) * limit

      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM social_connections WHERE follower_id = $1',
        [userId]
      )

      const total = parseInt(countResult.rows[0].count)

      // Get following with their stats
      const result = await db.query(
        `SELECT 
          u.id,
          u.display_name,
          COUNT(DISTINCT ap.activity_id) as total_runs,
          COALESCE(AVG(ar.rating), 0) as average_rating
         FROM users u
         JOIN social_connections sc ON u.id = sc.following_id
         LEFT JOIN activity_participants ap ON u.id = ap.user_id
         LEFT JOIN activities a ON ap.activity_id = a.id AND a.status = 'completed'
         LEFT JOIN activity_ratings ar ON a.id = ar.activity_id AND a.creator_id = u.id
         WHERE sc.follower_id = $1
         GROUP BY u.id, u.display_name
         ORDER BY u.display_name
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      )

      const users: UserSearchResult[] = result.rows.map(row => ({
        id: row.id,
        displayName: row.display_name,
        totalRuns: parseInt(row.total_runs),
        averageRating: parseFloat(row.average_rating),
        isFollowing: true,
      }))

      return { users, total }
    } catch (error) {
      console.error('Error fetching following:', error)
      throw new Error('Failed to fetch following')
    }
  }

  /**
   * Search users by display name
   */
  async searchUsers(
    query: string,
    requestingUserId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: UserSearchResult[], total: number }> {
    try {
      const offset = (page - 1) * limit
      const searchPattern = `%${query.toLowerCase()}%`

      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) as count FROM users WHERE LOWER(display_name) LIKE $1',
        [searchPattern]
      )

      const total = parseInt(countResult.rows[0].count)

      // Search users with their stats
      const result = await db.query(
        `SELECT 
          u.id,
          u.display_name,
          COUNT(DISTINCT ap.activity_id) as total_runs,
          COALESCE(AVG(ar.rating), 0) as average_rating,
          CASE 
            WHEN $2::uuid IS NOT NULL THEN EXISTS(
              SELECT 1 FROM social_connections 
              WHERE follower_id = $2 AND following_id = u.id
            )
            ELSE false
          END as is_following
         FROM users u
         LEFT JOIN activity_participants ap ON u.id = ap.user_id
         LEFT JOIN activities a ON ap.activity_id = a.id AND a.status = 'completed'
         LEFT JOIN activity_ratings ar ON a.id = ar.activity_id AND a.creator_id = u.id
         WHERE LOWER(u.display_name) LIKE $1
         GROUP BY u.id, u.display_name
         ORDER BY u.display_name
         LIMIT $3 OFFSET $4`,
        [searchPattern, requestingUserId || null, limit, offset]
      )

      const users: UserSearchResult[] = result.rows.map(row => ({
        id: row.id,
        displayName: row.display_name,
        totalRuns: parseInt(row.total_runs),
        averageRating: parseFloat(row.average_rating),
        isFollowing: row.is_following,
      }))

      return { users, total }
    } catch (error) {
      console.error('Error searching users:', error)
      throw new Error('Failed to search users')
    }
  }
}

export const userService = new UserService()
