export interface ChatRoom {
  id: string
  activityId: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
}

export interface ChatMessageWithSender extends ChatMessage {
  senderName: string
}
