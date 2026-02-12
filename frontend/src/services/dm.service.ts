import axios from 'axios';

const API_BASE_URL = '/api';

export interface DMFriend {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface DMRoom {
  id: string;
  otherUser: DMFriend;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface DMMessage {
  id: string;
  dmRoomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export const dmService = {
  async getOrCreateRoom(otherUserId: string): Promise<DMRoom> {
    const response = await axios.post<{ data: DMRoom }>(
      `${API_BASE_URL}/chat/dm/rooms`,
      { otherUserId }
    );
    return response.data.data;
  },

  async getRooms(): Promise<DMRoom[]> {
    const response = await axios.get<{ data: DMRoom[] }>(
      `${API_BASE_URL}/chat/dm/rooms`
    );
    return response.data.data;
  },

  async getMessages(
    roomId: string,
    page = 1,
    limit = 50
  ): Promise<{ messages: DMMessage[]; total: number }> {
    const response = await axios.get<{
      data: { messages: DMMessage[]; pagination: { total: number } };
    }>(`${API_BASE_URL}/chat/dm/rooms/${roomId}/messages`, {
      params: { page, limit },
    });
    const { data } = response.data;
    return { messages: data.messages, total: data.pagination.total };
  },

  async sendMessage(roomId: string, content: string): Promise<DMMessage> {
    const response = await axios.post<{ data: DMMessage }>(
      `${API_BASE_URL}/chat/dm/rooms/${roomId}/messages`,
      { content }
    );
    return response.data.data;
  },
};
