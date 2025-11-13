// Database table types

export interface User {
  id: string
  email: string
  password_hash: string
  display_name: string
  age: number
  agreed_to_terms: boolean
  created_at: Date
  updated_at: Date
}

export interface Activity {
  id: string
  creator_id: string
  title: string
  description: string | null
  scheduled_date: Date
  latitude: number
  longitude: number
  address: string | null
  route: string | null
  distance: number
  max_participants: number
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled'
  created_at: Date
  updated_at: Date
}

export interface ActivityParticipant {
  activity_id: string
  user_id: string
  joined_at: Date
}

export interface SocialConnection {
  follower_id: string
  following_id: string
  created_at: Date
}

export interface Route {
  id: string
  activity_id: string
  user_id: string
  total_distance: number
  average_speed: number
  duration: number
  start_time: Date
  end_time: Date
  positions_s3_key: string | null
  created_at: Date
}

export interface ChatRoom {
  id: string
  activity_id: string
  created_at: Date
}

export interface ChatMessage {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  created_at: Date
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  related_id: string | null
  is_read: boolean
  created_at: Date
}

export interface ActivityRating {
  id: string
  activity_id: string
  user_id: string
  rating: number
  feedback: string | null
  created_at: Date
}

// Helper types for queries
export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type NewActivity = Omit<Activity, 'id' | 'created_at' | 'updated_at'>
export type NewRoute = Omit<Route, 'id' | 'created_at'>
export type NewChatMessage = Omit<ChatMessage, 'id' | 'created_at'>
export type NewNotification = Omit<Notification, 'id' | 'created_at'>
export type NewActivityRating = Omit<ActivityRating, 'id' | 'created_at'>
