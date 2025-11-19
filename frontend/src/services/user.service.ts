import axios from 'axios';
import { UserProfile, UserSearchResult } from '../types/user.types';

const API_BASE_URL = '/api';

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await axios.get<UserProfile>(`${API_BASE_URL}/users/${userId}`);
    return response.data;
  },

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await axios.put<UserProfile>(`${API_BASE_URL}/users/${userId}`, data);
    return response.data;
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

  async getFollowers(userId: string): Promise<UserSearchResult[]> {
    const response = await axios.get<UserSearchResult[]>(`${API_BASE_URL}/users/${userId}/followers`);
    return response.data;
  },

  async getFollowing(userId: string): Promise<UserSearchResult[]> {
    const response = await axios.get<UserSearchResult[]>(`${API_BASE_URL}/users/${userId}/following`);
    return response.data;
  },

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const response = await axios.get<UserSearchResult[]>(`${API_BASE_URL}/users/search`, {
      params: { q: query },
    });
    return response.data;
  },

  async getUserRatings(userId: string, page = 1, limit = 20): Promise<{ ratings: any[]; averageRating: number; totalRatings: number }> {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/ratings`, {
      params: { page, limit },
    });
    return response.data.data;
  },
};
