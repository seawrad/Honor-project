export type NotificationType =
  | 'activity_reminder'
  | 'activity_cancelled'
  | 'new_message'
  | 'chat_message'
  | 'new_follower'
  | 'activity_joined';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}
