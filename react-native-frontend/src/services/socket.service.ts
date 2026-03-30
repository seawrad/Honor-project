import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../utils/tokenStorage';
import { ChatMessage } from './chat.service';

type ParticipantLocation = {
  userId: string;
  displayName: string;
  isHost: boolean;
  latitude: number;
  longitude: number;
  avatarUrl?: string | null;
  speedKmh?: number;
};

type ErrorPayload = {
  code?: string;
  message?: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

class SocketService {
  private socket: Socket | null = null;

  async connect(): Promise<Socket | null> {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = await tokenStorage.getAccessToken();
    if (!token) {
      return null;
    }

    if (this.socket) {
      this.socket.auth = { token };
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
    });

    return this.socket;
  }

  async connectAndWait(): Promise<Socket | null> {
    const socket = await this.connect();
    if (!socket) {
      return null;
    }

    if (socket.connected) {
      return socket;
    }

    return new Promise((resolve, reject) => {
      const handleConnect = () => {
        socket.off('connect_error', handleError);
        resolve(socket);
      };

      const handleError = (error: Error) => {
        socket.off('connect', handleConnect);
        reject(error);
      };

      socket.once('connect', handleConnect);
      socket.once('connect_error', handleError);
      socket.connect();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string): void {
    this.socket?.emit('join_room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.socket?.emit('leave_room', { roomId });
  }

  joinActivityTracking(activityId: string): void {
    this.socket?.emit('join_activity_tracking', { activityId });
  }

  leaveActivityTracking(activityId: string): void {
    this.socket?.emit('leave_activity_tracking', { activityId });
  }

  emitLocationUpdate(activityId: string, latitude: number, longitude: number, speedKmh?: number): void {
    this.socket?.emit('location_update', { activityId, latitude, longitude, speedKmh });
  }

  sendMessage(roomId: string, content: string): void {
    this.socket?.emit('send_message', { roomId, content });
  }

  onMessageReceived(handler: (message: ChatMessage & { chatRoomId: string }) => void): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    const listener = (payload: ChatMessage & { chatRoomId: string }) => {
      handler(payload);
    };

    this.socket.on('message_received', listener);
    return () => {
      this.socket?.off('message_received', listener);
    };
  }

  onError(handler: (error: ErrorPayload) => void): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    const listener = (payload: ErrorPayload) => {
      handler(payload);
    };

    this.socket.on('error', listener);
    return () => {
      this.socket?.off('error', listener);
    };
  }

  onLocationReceived(handler: (payload: ParticipantLocation) => void): () => void {
    if (!this.socket) {
      return () => undefined;
    }

    const listener = (payload: ParticipantLocation) => {
      handler(payload);
    };

    this.socket.on('location_received', listener);
    return () => {
      this.socket?.off('location_received', listener);
    };
  }

  off(event: string, listener?: (...args: any[]) => void): void {
    if (!this.socket) {
      return;
    }

    if (listener) {
      this.socket.off(event, listener);
      return;
    }

    this.socket.off(event);
  }
}

export const socketService = new SocketService();
