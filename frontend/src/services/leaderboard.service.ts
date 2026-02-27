import axios from 'axios';

const API_BASE_URL = '/api';

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
    const response = await axios.get<{ data: LeaderboardEntry[] }>(
      `${API_BASE_URL}/leaderboard`,
      { params: { type, limit } }
    );
    return response.data.data;
  },
};
