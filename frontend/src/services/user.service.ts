import axios from 'axios';
import { UserProfile, UserSearchResult, UpdateProfileData } from '../types/user.types';

const API_BASE_URL = '/api';

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await axios.get<{ data: UserProfile }>(`${API_BASE_URL}/users/${userId}`);
    return response.data.data;
  },

  async updateUserProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    const body: Record<string, unknown> = {};
    if (data.displayName !== undefined) body.displayName = data.displayName;
    if (data.age !== undefined) body.age = data.age;
    if (data.avatarUrl !== undefined) body.avatarUrl = data.avatarUrl;
    const response = await axios.put<{ data: UserProfile }>(`${API_BASE_URL}/users/${userId}`, body);
    return response.data.data;
  },

  async deleteAccount(userId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/users/${userId}`);
  },

  async followUser(userId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/users/${userId}/follow`);
  },

  async unfollowUser(userId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/users/${userId}/follow`);
  },

  async getFollowers(userId: string, page = 1, limit = 20): Promise<UserSearchResult[]> {
    const response = await axios.get<{ data: UserSearchResult[] }>(
      `${API_BASE_URL}/users/${userId}/followers`,
      { params: { page, limit } }
    );
    return response.data.data;
  },

  async getFollowing(userId: string, page = 1, limit = 20): Promise<UserSearchResult[]> {
    const response = await axios.get<{ data: UserSearchResult[] }>(
      `${API_BASE_URL}/users/${userId}/following`,
      { params: { page, limit } }
    );
    return response.data.data;
  },

  async searchUsers(query: string, page = 1, limit = 20): Promise<UserSearchResult[]> {
    const response = await axios.get<{ data: UserSearchResult[] }>(`${API_BASE_URL}/users/search`, {
      params: { q: query, page, limit },
    });
    return response.data.data;
  },

  async getUserStatsSummary(userId: string): Promise<{
    weeklyDistanceKm: number;
    monthlyCompletedActivities: number;
    monthlyDistanceKm: number;
    level: { name: string; nameZh: string; currentKm: number; nextLevelKm: number | null; progressPercent: number };
  }> {
    const response = await axios.get<{ data: any }>(`${API_BASE_URL}/users/${userId}/stats`);
    return response.data.data;
  },

  async getUserRatings(userId: string, page = 1, limit = 20): Promise<{ ratings: any[]; averageRating: number; totalRatings: number }> {
    const response = await axios.get<{ data: { ratings: any[]; averageRating: number; totalRatings: number } }>(
      `${API_BASE_URL}/users/${userId}/ratings`,
      { params: { page, limit } }
    );
    return response.data.data;
  },
};
