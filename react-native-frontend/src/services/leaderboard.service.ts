import apiClient from '../utils/apiClient';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  value: number;
  unit: string;
}

export type LeaderboardType = 'weekly_km' | 'monthly_km' | 'weekly_runs' | 'monthly_runs';

export const leaderboardService = {
  async getLeaderboard(type: LeaderboardType = 'weekly_km', limit = 20): Promise<LeaderboardEntry[]> {
    const response = await apiClient.get<{ data: LeaderboardEntry[] }>('/leaderboard', {
      params: { type, limit },
    });
    return response.data.data;
  },
};
