// Notification types and interfaces

export type NotificationType = 
  | 'activity_reminder' 
  | 'activity_cancelled' 
  | 'new_message' 
  | 'new_follower' 
  | 'activity_joined'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
  isRead: boolean
  createdAt: string
}

export interface CreateNotificationRequest {
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  total: number
  unreadCount: number
}
