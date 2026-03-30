import apiClient from '../utils/apiClient';

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
    const response = await apiClient.get<{ data: Achievement[] }>('/achievements');
    return response.data.data;
  },

  async getUnlockedCount(): Promise<number> {
    const response = await apiClient.get<{ data: { count: number } }>('/achievements/count');
    return response.data.data.count;
  },
};
