import { Socket } from 'socket.io'

// Extend Socket interface to include userId
export interface AuthenticatedSocket extends Socket {
  userId?: string
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

// Socket event responses
export interface MessageReceivedPayload {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
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
