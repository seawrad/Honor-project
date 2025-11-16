import axios from 'axios'
import { ChatRoom, ChatMessage } from '../types/chat.types'
import { getAccessToken } from '../utils/tokenStorage'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ChatService {
  /**
   * Get chat room by activity ID
   */
  async getChatRoomByActivityId(activityId: string): Promise<ChatRoom> {
    const token = getAccessToken()
    const response = await axios.get(`${API_URL}/api/chat/rooms/${activityId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  }

  /**
   * Get chat messages for a room
   */
  async getChatMessages(
    roomId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const token = getAccessToken()
    const response = await axios.get(
      `${API_URL}/api/chat/rooms/${roomId}/messages`,
      {
        params: { limit, offset },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    return response.data
  }
}

export const chatService = new ChatService()
