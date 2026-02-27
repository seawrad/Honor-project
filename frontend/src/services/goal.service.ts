import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

export interface UserGoal {
  id: string;
  userId: string;
  goalType: string;
  targetValue: number;
  periodStart: string;
  periodEnd: string;
  currentValue?: number;
  progressPercent?: number;
}

export const goalService = {
  async getMyGoals(): Promise<UserGoal[]> {
    const response = await axios.get<{ data: UserGoal[] }>(
      `${API_BASE_URL}/goals`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },

  async setWeeklyGoal(targetKm: number): Promise<UserGoal> {
    const response = await axios.post<{ data: UserGoal }>(
      `${API_BASE_URL}/goals/weekly`,
      { targetKm },
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },

  async setMonthlyGoal(targetKm: number): Promise<UserGoal> {
    const response = await axios.post<{ data: UserGoal }>(
      `${API_BASE_URL}/goals/monthly`,
      { targetKm },
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },
};
