import axios from 'axios';
import { Notification, NotificationListResponse } from '../types/notification.types';

const API_BASE_URL = '/api';

export const notificationService = {
  async getNotifications(): Promise<NotificationListResponse> {
    const response = await axios.get<NotificationListResponse>(
      `${API_BASE_URL}/notifications`
    );
    return response.data;
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
