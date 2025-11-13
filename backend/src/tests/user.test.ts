import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { userService } from '../services/user.service.js'
import { authService } from '../services/auth.service.js'
import { db } from '../database/db.js'
import { ValidationError } from '../utils/validation.js'

describe('User Service', () => {
  let testUser1Id: string
  let testUser2Id: string
  let testUser3Id: string

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
      displayName: 'Another User',
      age: 35,
      agreedToTerms: true,
    })
    testUser3Id = user3.id
  })

  describe('Profile Retrieval', () => {
    it('should get user profile with statistics', async () => {
      const profile = await userService.getUserProfile(testUser1Id)

      expect(profile).toBeDefined()
      expect(profile.id).toBe(testUser1Id)
      expect(profile.email).toBe('user1@test.com')
      expect(profile.displayName).toBe('Test User One')
      expect(profile.age).toBe(25)
      expect(profile.totalRuns).toBe(0)
      expect(profile.totalDistance).toBe(0)
      expect(profile.averageRating).toBe(0)
      expect(profile.followersCount).toBe(0)
      expect(profile.followingCount).toBe(0)
    })

    it('should throw error for non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      await expect(userService.getUserProfile(fakeUserId)).rejects.toThrow(ValidationError)
      await expect(userService.getUserProfile(fakeUserId)).rejects.toThrow('User not found')
    })
  })

  describe('Profile Updates', () => {
    it('should update user display name', async () => {
      const updatedProfile = await userService.updateProfile(testUser1Id, {
        displayName: 'Updated Name',
      })

      expect(updatedProfile.displayName).toBe('Updated Name')
      expect(updatedProfile.age).toBe(25) // Age should remain unchanged
    })

    it('should update user age', async () => {
      const updatedProfile = await userService.updateProfile(testUser1Id, {
        age: 40,
      })

      expect(updatedProfile.age).toBe(40)
      expect(updatedProfile.displayName).toBe('Test User One') // Name should remain unchanged
    })

    it('should update both display name and age', async () => {
      const updatedProfile = await userService.updateProfile(testUser1Id, {
        displayName: 'New Name',
        age: 45,
      })

      expect(updatedProfile.displayName).toBe('New Name')
      expect(updatedProfile.age).toBe(45)
    })

    it('should reject age below 18', async () => {
      await expect(
        userService.updateProfile(testUser1Id, { age: 17 })
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.updateProfile(testUser1Id, { age: 17 })
      ).rejects.toThrow('Age must be between 18 and 65 years')
    })

    it('should reject age above 65', async () => {
      await expect(
        userService.updateProfile(testUser1Id, { age: 66 })
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.updateProfile(testUser1Id, { age: 66 })
      ).rejects.toThrow('Age must be between 18 and 65 years')
    })

    it('should reject empty display name', async () => {
      await expect(
        userService.updateProfile(testUser1Id, { displayName: '   ' })
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.updateProfile(testUser1Id, { displayName: '   ' })
      ).rejects.toThrow('Display name cannot be empty')
    })
  })

  describe('Follow/Unfollow Operations', () => {
    it('should follow a user', async () => {
      await userService.followUser(testUser1Id, testUser2Id)

      const profile = await userService.getUserProfile(testUser2Id)
      expect(profile.followersCount).toBe(1)

      const followerProfile = await userService.getUserProfile(testUser1Id)
      expect(followerProfile.followingCount).toBe(1)
    })

    it('should prevent self-following', async () => {
      await expect(
        userService.followUser(testUser1Id, testUser1Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.followUser(testUser1Id, testUser1Id)
      ).rejects.toThrow('Cannot follow yourself')
    })

    it('should prevent duplicate follows', async () => {
      await userService.followUser(testUser1Id, testUser2Id)

      await expect(
        userService.followUser(testUser1Id, testUser2Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.followUser(testUser1Id, testUser2Id)
      ).rejects.toThrow('Already following this user')
    })

    it('should throw error when following non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      await expect(
        userService.followUser(testUser1Id, fakeUserId)
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.followUser(testUser1Id, fakeUserId)
      ).rejects.toThrow('User not found')
    })

    it('should unfollow a user', async () => {
      // First follow
      await userService.followUser(testUser1Id, testUser2Id)

      // Then unfollow
      await userService.unfollowUser(testUser1Id, testUser2Id)

      const profile = await userService.getUserProfile(testUser2Id)
      expect(profile.followersCount).toBe(0)

      const followerProfile = await userService.getUserProfile(testUser1Id)
      expect(followerProfile.followingCount).toBe(0)
    })

    it('should throw error when unfollowing a user not being followed', async () => {
      await expect(
        userService.unfollowUser(testUser1Id, testUser2Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.unfollowUser(testUser1Id, testUser2Id)
      ).rejects.toThrow('Not following this user')
    })

    it('should get followers list', async () => {
      // User2 and User3 follow User1
      await userService.followUser(testUser2Id, testUser1Id)
      await userService.followUser(testUser3Id, testUser1Id)

      const { users, total } = await userService.getFollowers(testUser1Id)

      expect(total).toBe(2)
      expect(users).toHaveLength(2)
      expect(users.some(u => u.id === testUser2Id)).toBe(true)
      expect(users.some(u => u.id === testUser3Id)).toBe(true)
    })

    it('should get following list', async () => {
      // User1 follows User2 and User3
      await userService.followUser(testUser1Id, testUser2Id)
      await userService.followUser(testUser1Id, testUser3Id)

      const { users, total } = await userService.getFollowing(testUser1Id)

      expect(total).toBe(2)
      expect(users).toHaveLength(2)
      expect(users.some(u => u.id === testUser2Id)).toBe(true)
      expect(users.some(u => u.id === testUser3Id)).toBe(true)
    })

    it('should paginate followers list', async () => {
      // User2 and User3 follow User1
      await userService.followUser(testUser2Id, testUser1Id)
      await userService.followUser(testUser3Id, testUser1Id)

      const { users, total } = await userService.getFollowers(testUser1Id, 1, 1)

      expect(total).toBe(2)
      expect(users).toHaveLength(1)
    })
  })

  describe('User Search', () => {
    it('should search users by display name (case-insensitive)', async () => {
      const { users, total } = await userService.searchUsers('test user')

      expect(total).toBe(2) // Should find "Test User One" and "Test User Two"
      expect(users).toHaveLength(2)
      expect(users.some(u => u.displayName === 'Test User One')).toBe(true)
      expect(users.some(u => u.displayName === 'Test User Two')).toBe(true)
    })

    it('should search users with partial match', async () => {
      const { users, total } = await userService.searchUsers('another')

      expect(total).toBe(1)
      expect(users).toHaveLength(1)
      expect(users[0].displayName).toBe('Another User')
    })

    it('should return empty results for non-matching search', async () => {
      const { users, total } = await userService.searchUsers('nonexistent')

      expect(total).toBe(0)
      expect(users).toHaveLength(0)
    })

    it('should show follow status when requesting user is provided', async () => {
      // User1 follows User2
      await userService.followUser(testUser1Id, testUser2Id)

      const { users } = await userService.searchUsers('test user', testUser1Id)

      const user2Result = users.find(u => u.id === testUser2Id)
      const user1Result = users.find(u => u.id === testUser1Id)

      expect(user2Result?.isFollowing).toBe(true)
      expect(user1Result?.isFollowing).toBe(false)
    })

    it('should paginate search results', async () => {
      const { users, total } = await userService.searchUsers('test user', undefined, 1, 1)

      expect(total).toBe(2)
      expect(users).toHaveLength(1)
    })

    it('should include user statistics in search results', async () => {
      const { users } = await userService.searchUsers('test user one')

      expect(users).toHaveLength(1)
      expect(users[0].totalRuns).toBeDefined()
      expect(users[0].averageRating).toBeDefined()
    })
  })

  describe('Account Deletion', () => {
    it('should delete user account', async () => {
      await userService.deleteAccount(testUser1Id)

      await expect(
        userService.getUserProfile(testUser1Id)
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.getUserProfile(testUser1Id)
      ).rejects.toThrow('User not found')
    })

    it('should throw error when deleting non-existent user', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000'

      await expect(
        userService.deleteAccount(fakeUserId)
      ).rejects.toThrow(ValidationError)
      await expect(
        userService.deleteAccount(fakeUserId)
      ).rejects.toThrow('User not found')
    })

    it('should cascade delete social connections', async () => {
      // User1 follows User2
      await userService.followUser(testUser1Id, testUser2Id)

      // Delete User1
      await userService.deleteAccount(testUser1Id)

      // User2 should have no followers
      const profile = await userService.getUserProfile(testUser2Id)
      expect(profile.followersCount).toBe(0)
    })
  })
})
