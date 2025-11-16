import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useChatNotifications } from '../useChatNotifications'
import { socketService } from '../../services/socket.service'
import { MessageReceivedPayload } from '../../types/chat.types'

// Mock socket service
vi.mock('../../services/socket.service')

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    isAuthenticated: true,
  }),
}))

// Mock Notification API
global.Notification = {
  permission: 'granted',
  requestPermission: vi.fn().mockResolvedValue('granted'),
} as any

describe('useChatNotifications', () => {
  let messageReceivedCallback: ((message: MessageReceivedPayload) => void) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    messageReceivedCallback = null

    // Capture the callback passed to onMessageReceived
    vi.mocked(socketService.onMessageReceived).mockImplementation((callback) => {
      messageReceivedCallback = callback
    })

    vi.mocked(socketService.off).mockImplementation(() => {})
  })

  it('should initialize with zero unread messages', () => {
    const { result } = renderHook(() => useChatNotifications())

    expect(result.current.totalUnread).toBe(0)
    expect(result.current.unreadMessages).toEqual({})
  })

  it('should increment unread count when receiving message from another user', async () => {
    const { result } = renderHook(() => useChatNotifications())

    const message: MessageReceivedPayload = {
      id: 'msg-1',
      chatRoomId: 'room-1',
      senderId: 'user-2',
      senderName: 'Other User',
      content: 'Hello',
      timestamp: new Date(),
    }

    // Simulate receiving a message
    if (messageReceivedCallback) {
      messageReceivedCallback(message)
    }

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(1)
      expect(result.current.unreadMessages['room-1']).toBe(1)
    })
  })

  it('should not increment unread count for own messages', async () => {
    const { result } = renderHook(() => useChatNotifications())

    const message: MessageReceivedPayload = {
      id: 'msg-1',
      chatRoomId: 'room-1',
      senderId: 'user-1', // Same as current user
      senderName: 'Test User',
      content: 'Hello',
      timestamp: new Date(),
    }

    if (messageReceivedCallback) {
      messageReceivedCallback(message)
    }

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(0)
    })
  })

  it('should track unread messages per room', async () => {
    const { result } = renderHook(() => useChatNotifications())

    const message1: MessageReceivedPayload = {
      id: 'msg-1',
      chatRoomId: 'room-1',
      senderId: 'user-2',
      senderName: 'User 2',
      content: 'Hello',
      timestamp: new Date(),
    }

    const message2: MessageReceivedPayload = {
      id: 'msg-2',
      chatRoomId: 'room-2',
      senderId: 'user-3',
      senderName: 'User 3',
      content: 'Hi',
      timestamp: new Date(),
    }

    if (messageReceivedCallback) {
      messageReceivedCallback(message1)
      messageReceivedCallback(message2)
    }

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(2)
      expect(result.current.unreadMessages['room-1']).toBe(1)
      expect(result.current.unreadMessages['room-2']).toBe(1)
    })
  })

  it('should mark room as read', async () => {
    const { result } = renderHook(() => useChatNotifications())

    const message: MessageReceivedPayload = {
      id: 'msg-1',
      chatRoomId: 'room-1',
      senderId: 'user-2',
      senderName: 'Other User',
      content: 'Hello',
      timestamp: new Date(),
    }

    if (messageReceivedCallback) {
      messageReceivedCallback(message)
    }

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(1)
    })

    // Mark room as read
    result.current.markRoomAsRead('room-1')

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(0)
      expect(result.current.unreadMessages['room-1']).toBeUndefined()
    })
  })

  it('should get unread count for specific room', async () => {
    const { result } = renderHook(() => useChatNotifications())

    const message: MessageReceivedPayload = {
      id: 'msg-1',
      chatRoomId: 'room-1',
      senderId: 'user-2',
      senderName: 'Other User',
      content: 'Hello',
      timestamp: new Date(),
    }

    if (messageReceivedCallback) {
      messageReceivedCallback(message)
    }

    await waitFor(() => {
      expect(result.current.getUnreadCount('room-1')).toBe(1)
      expect(result.current.getUnreadCount('room-2')).toBe(0)
    })
  })

  it('should calculate total unread messages correctly', async () => {
    const { result } = renderHook(() => useChatNotifications())

    if (messageReceivedCallback) {
      // Add 2 messages to room-1
      messageReceivedCallback({
        id: 'msg-1',
        chatRoomId: 'room-1',
        senderId: 'user-2',
        senderName: 'User 2',
        content: 'Hello',
        timestamp: new Date(),
      })
      messageReceivedCallback({
        id: 'msg-2',
        chatRoomId: 'room-1',
        senderId: 'user-2',
        senderName: 'User 2',
        content: 'Hi',
        timestamp: new Date(),
      })

      // Add 1 message to room-2
      messageReceivedCallback({
        id: 'msg-3',
        chatRoomId: 'room-2',
        senderId: 'user-3',
        senderName: 'User 3',
        content: 'Hey',
        timestamp: new Date(),
      })
    }

    await waitFor(() => {
      expect(result.current.totalUnread).toBe(3)
    })
  })
})
