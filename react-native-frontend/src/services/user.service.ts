import apiClient from '../utils/apiClient';

export interface User {
  id: string;
  email: string;
  displayName: string;
  age: number;
  totalRuns: number;
  totalDistance: number;
  averageRating: number;
  followersCount: number;
  followingCount: number;
  avatarUrl?: string | null;
  recentActivities: RecentActivity[];
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
  isFollowing?: boolean;
}

export interface RecentActivity {
  id: string;
  title: string;
  scheduledDate: string;
  distance: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
}

export interface UserStatsSummary {
  weeklyDistanceKm: number;
  monthlyCompletedActivities: number;
  monthlyDistanceKm: number;
  level: {
    name: string;
    nameZh: string;
    currentKm: number;
    nextLevelKm: number | null;
    progressPercent: number;
  };
}

export interface Friend {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface UserResponse {
  data: User;
}

interface StatsResponse {
  data: UserStatsSummary;
}

export const userService = {
  async getUserProfile(userId: string): Promise<User> {
    const response = await apiClient.get<UserResponse>(`/users/${userId}`);
    return response.data.data;
  },

  async getUserStatsSummary(userId: string): Promise<UserStatsSummary> {
    const response = await apiClient.get<StatsResponse>(`/users/${userId}/stats`);
    return response.data.data;
  },

  async updateUserProfile(data: Partial<User>): Promise<User> {
    if (!data.id) {
      throw new Error('User id is required to update profile');
    }
    const response = await apiClient.put<UserResponse>(`/users/${data.id}`, {
      displayName: data.displayName,
      age: data.age,
      avatarUrl: data.avatarUrl,
    });
    return response.data.data;
  },

  async searchUsers(keyword: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(
      `/users/search?q=${encodeURIComponent(keyword)}`
    );
    return response.data.data;
  },

  async followUser(userId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/follow`);
  },

  async unfollowUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/follow`);
  },

  async getFollowers(userId: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(`/users/${userId}/followers`);
    return response.data.data;
  },

  async getFollowing(userId: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(`/users/${userId}/following`);
    return response.data.data;
  },

  async getFriends(): Promise<Friend[]> {
    const response = await apiClient.get<{ data: Friend[] }>('/users/me/friends');
    return response.data.data;
  },
};
