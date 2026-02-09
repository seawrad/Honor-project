import axios from 'axios'
import { ChatRoom, ChatMessage } from '../types/chat.types'

const API_BASE_URL = '/api'

class ChatService {
  /**
   * Get chat room by activity ID
   */
  async getChatRoomByActivityId(activityId: string): Promise<ChatRoom> {
    const response = await axios.get<{ data: ChatRoom }>(
      `${API_BASE_URL}/chat/rooms/${activityId}`
    )
    return response.data.data
  }

  /**
   * Get chat messages for a room
   */
  async getChatMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const response = await axios.get<{
      data: { messages: ChatMessage[]; pagination: { total: number } }
    }>(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
      params: { limit, page: offset ? Math.floor(offset / limit) + 1 : 1 },
    })
    const { data } = response.data
    return { messages: data.messages, total: data.pagination.total }
  }
}

export const chatService = new ChatService()
