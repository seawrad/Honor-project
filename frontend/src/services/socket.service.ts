import { io, Socket } from 'socket.io-client'
import { tokenStorage } from '../utils/tokenStorage'
import {
  JoinRoomPayload,
  LeaveRoomPayload,
  SendMessagePayload,
  MessageReceivedPayload,
  UserJoinedPayload,
  UserLeftPayload,
  ErrorPayload,
} from '../types/chat.types'

// In dev: use same origin so Vite proxy forwards /socket.io to backend
// In production: use VITE_API_URL or fallback to same origin
const SOCKET_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || undefined

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  /**
   * Initialize Socket.io connection with JWT authentication
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket
    }

    const token = tokenStorage.getAccessToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    this.socket = io(SOCKET_URL || undefined, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    })

    this.setupEventHandlers()

    return this.socket
  }

  /**
   * Connect and wait until socket is connected (for use before joinRoom)
   */
  async connectAndWait(): Promise<Socket> {
    const socket = this.connect()
    if (socket.connected) return socket

    return new Promise((resolve, reject) => {
      const onConnect = () => {
        socket.off('connect_error', onError)
        resolve(socket)
      }
      const onError = (err: Error) => {
        socket.off('connect', onConnect)
        reject(err)
      }
      socket.once('connect', onConnect)
      socket.once('connect_error', onError)
    })
  }

  /**
   * Setup connection event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id)
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        this.disconnect()
      }
    })

    this.socket.on('error', (error: ErrorPayload) => {
      console.error('Socket error:', error)
    })
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.reconnectAttempts = 0
    }
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  /**
   * Join a chat room
   */
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected')
    }

    const payload: JoinRoomPayload = { roomId }
    this.socket.emit('join_room', payload)
  }

  /**
   * Leave a chat room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected')
    }

    const payload: LeaveRoomPayload = { roomId }
    this.socket.emit('leave_room', payload)
  }

  /**
   * Send a message to a chat room
   */
  sendMessage(roomId: string, content: string): void {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected')
    }

    const payload: SendMessagePayload = { roomId, content }
    this.socket.emit('send_message', payload)
  }

  /**
   * Listen for message received events
   */
  onMessageReceived(callback: (message: MessageReceivedPayload) => void): void {
    if (!this.socket) return
    this.socket.on('message_received', callback)
  }

  /**
   * Listen for user joined events
   */
  onUserJoined(callback: (data: UserJoinedPayload) => void): void {
    if (!this.socket) return
    this.socket.on('user_joined', callback)
  }

  /**
   * Listen for user left events
   */
  onUserLeft(callback: (data: UserLeftPayload) => void): void {
    if (!this.socket) return
    this.socket.on('user_left', callback)
  }

  /**
   * Listen for joined room confirmation
   */
  onJoinedRoom(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) return
    this.socket.on('joined_room', callback)
  }

  /**
   * Listen for left room confirmation
   */
  onLeftRoom(callback: (data: { roomId: string }) => void): void {
    if (!this.socket) return
    this.socket.on('left_room', callback)
  }

  /**
   * Emit typing event
   */
  emitTyping(roomId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('typing', { roomId })
  }

  /**
   * Emit stop typing event
   */
  emitStopTyping(roomId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('stop_typing', { roomId })
  }

  /**
   * Listen for user typing events
   */
  onUserTyping(callback: (data: { userId: string; displayName: string }) => void): void {
    if (!this.socket) return
    this.socket.on('user_typing', callback)
  }

  /**
   * Listen for user stop typing events
   */
  onUserStopTyping(callback: (data: { userId: string }) => void): void {
    if (!this.socket) return
    this.socket.on('user_stop_typing', callback)
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    if (!this.socket) return
    this.socket.removeAllListeners()
  }

  /**
   * Remove specific event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return
    this.socket.off(event, callback)
  }

  // --- Activity tracking (participant location sharing) ---

  joinActivityTracking(activityId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('join_activity_tracking', { activityId })
  }

  leaveActivityTracking(activityId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('leave_activity_tracking', { activityId })
  }

  emitLocationUpdate(activityId: string, latitude: number, longitude: number, speedKmh?: number): void {
    if (!this.socket?.connected) return
    this.socket.emit('location_update', { activityId, latitude, longitude, speedKmh })
  }

  onLocationReceived(callback: (data: { userId: string; displayName: string; isHost: boolean; latitude: number; longitude: number; avatarUrl?: string | null; speedKmh?: number }) => void): void {
    if (!this.socket) return
    this.socket.on('location_received', callback)
  }

  onJoinedActivityTracking(callback: (data: { activityId: string }) => void): void {
    if (!this.socket) return
    this.socket.on('joined_activity_tracking', callback)
  }
}

// Export singleton instance
export const socketService = new SocketService()
