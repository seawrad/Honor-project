// Chat message interface
export interface ChatMessage {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

// Chat room interface
export interface ChatRoom {
  id: string
  activityId: string
  createdAt: Date
}

// Socket event payloads
export interface JoinRoomPayload {
  roomId: string
}

export interface LeaveRoomPayload {
  roomId: string
}

export interface SendMessagePayload {
  roomId: string
  content: string
}

export interface MessageReceivedPayload {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
}

export interface UserJoinedPayload {
  userId: string
  displayName: string
}

export interface UserLeftPayload {
  userId: string
}

export interface ErrorPayload {
  code: string
  message: string
}
