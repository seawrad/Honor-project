import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  conditionType: string;
  conditionValue: number | null;
  sortOrder: number;
  unlockedAt: string | null;
  isUnlocked: boolean;
}

export const achievementService = {
  async getMyAchievements(): Promise<Achievement[]> {
    const response = await axios.get<{ data: Achievement[] }>(
      `${API_BASE_URL}/achievements`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },

  async getUnlockedCount(): Promise<number> {
    const response = await axios.get<{ data: { count: number } }>(
      `${API_BASE_URL}/achievements/count`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data.count;
  },

  async checkAchievements(): Promise<string[]> {
    const response = await axios.post<{ data: { newlyUnlocked: string[] } }>(
      `${API_BASE_URL}/achievements/check`,
      {},
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data.newlyUnlocked;
  },
};
