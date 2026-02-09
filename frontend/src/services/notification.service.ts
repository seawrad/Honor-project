import axios from 'axios';
import { NotificationListResponse } from '../types/notification.types';

const API_BASE_URL = '/api';

export const notificationService = {
  async getNotifications(limit = 50, offset = 0): Promise<NotificationListResponse> {
    const response = await axios.get<{ data: NotificationListResponse }>(
      `${API_BASE_URL}/notifications`,
      { params: { limit, offset } }
    );
    return response.data.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await axios.put(`${API_BASE_URL}/notifications/read-all`);
  },

  async deleteNotification(notificationId: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);
  },
};
