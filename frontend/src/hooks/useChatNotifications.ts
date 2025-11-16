import { useState, useEffect, useCallback } from 'react'
import { socketService } from '../services/socket.service'
import { MessageReceivedPayload } from '../types/chat.types'
import { useAuth } from './useAuth'

interface UnreadMessages {
  [roomId: string]: number
}

export const useChatNotifications = () => {
  const { user } = useAuth()
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessages>({})
  const [totalUnread, setTotalUnread] = useState(0)

  // Calculate total unread messages
  useEffect(() => {
    const total = Object.values(unreadMessages).reduce((sum, count) => sum + count, 0)
    setTotalUnread(total)
  }, [unreadMessages])

  // Listen for new messages
  useEffect(() => {
    if (!user) return

    const handleMessageReceived = (message: MessageReceivedPayload) => {
      // Don't count own messages
      if (message.senderId === user.id) {
        return
      }

      // Increment unread count for this room
      setUnreadMessages((prev) => ({
        ...prev,
        [message.chatRoomId]: (prev[message.chatRoomId] || 0) + 1,
      }))

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `${message.senderName}: ${message.content}`,
          icon: '/icon.png',
        })
      }

      // Play notification sound (optional)
      playNotificationSound()
    }

    socketService.onMessageReceived(handleMessageReceived)

    return () => {
      socketService.off('message_received', handleMessageReceived)
    }
  }, [user])

  // Mark room as read
  const markRoomAsRead = useCallback((roomId: string) => {
    setUnreadMessages((prev) => {
      const updated = { ...prev }
      delete updated[roomId]
      return updated
    })
  }, [])

  // Get unread count for a specific room
  const getUnreadCount = useCallback(
    (roomId: string): number => {
      return unreadMessages[roomId] || 0
    },
    [unreadMessages]
  )

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  return {
    unreadMessages,
    totalUnread,
    markRoomAsRead,
    getUnreadCount,
    requestNotificationPermission,
  }
}

// Play notification sound
function playNotificationSound() {
  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.5
    audio.play().catch((err) => {
      console.log('Could not play notification sound:', err)
    })
  } catch (err) {
    console.log('Notification sound not available')
  }
}
