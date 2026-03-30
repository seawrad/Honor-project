import apiClient from '../utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_SEEN_MAP_KEY = 'chatSeenMap';

export interface ChatRoom {
  id: string;
  activityId: string;
  createdAt: string;
}

export interface DMRoom {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export const chatService = {
  async getChatRoomByActivityId(activityId: string): Promise<ChatRoom> {
    const response = await apiClient.get<{ data: ChatRoom }>(`/chat/rooms/${activityId}`);
    return response.data.data;
  },

  async getDMRooms(): Promise<DMRoom[]> {
    const response = await apiClient.get<{ data: DMRoom[] }>('/chat/dm/rooms');
    return response.data.data;
  },

  async getOrCreateDMRoom(otherUserId: string): Promise<DMRoom> {
    const response = await apiClient.post<{ data: DMRoom }>('/chat/dm/rooms', { otherUserId });
    return response.data.data;
  },

  async getActivityMessages(roomId: string, page = 1, limit = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get<{ data: { messages: ChatMessage[] } }>(`/chat/rooms/${roomId}/messages`, {
      params: { page, limit },
    });
    return response.data.data.messages;
  },

  async getDMMessages(roomId: string, page = 1, limit = 50): Promise<ChatMessage[]> {
    const response = await apiClient.get<{ data: { messages: ChatMessage[] } }>(`/chat/dm/rooms/${roomId}/messages`, {
      params: { page, limit },
    });
    return response.data.data.messages;
  },

  async sendDMMessage(roomId: string, content: string): Promise<ChatMessage> {
    const response = await apiClient.post<{ data: ChatMessage }>(`/chat/dm/rooms/${roomId}/messages`, {
      content,
    });
    return response.data.data;
  },

  async getSeenMap(): Promise<Record<string, string>> {
    const raw = await AsyncStorage.getItem(CHAT_SEEN_MAP_KEY);
    if (!raw) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  },

  async markRoomSeen(roomId: string): Promise<void> {
    const seenMap = await this.getSeenMap();
    seenMap[roomId] = new Date().toISOString();
    await AsyncStorage.setItem(CHAT_SEEN_MAP_KEY, JSON.stringify(seenMap));
  },

  isUnread(roomId: string | undefined, lastMessageAt: string | undefined, seenMap: Record<string, string>): boolean {
    if (!roomId || !lastMessageAt) {
      return false;
    }
    const seenAt = seenMap[roomId];
    if (!seenAt) {
      return true;
    }
    return new Date(lastMessageAt).getTime() > new Date(seenAt).getTime();
  },
};
