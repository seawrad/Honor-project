import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ChatMessage, MessageReceivedPayload } from '../types/chat.types'
import { chatService } from '../services/chat.service'
import { socketService } from '../services/socket.service'
import { useAuth } from '../hooks/useAuth'
import { MessageInput } from './MessageInput'

interface ChatRoomProps {
  activityId: string
  onUnreadCountChange?: (count: number) => void
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ activityId, onUnreadCountChange }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const [unreadCount, setUnreadCount] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Reset unread count when chat becomes visible
  useEffect(() => {
    if (isVisible && unreadCount > 0) {
      setUnreadCount(0)
      onUnreadCountChange?.(0)
    }
  }, [isVisible, unreadCount, onUnreadCountChange])

  // Track visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Load chat room and messages
  useEffect(() => {
    const loadChatRoom = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get chat room
        const room = await chatService.getChatRoomByActivityId(activityId)
        setRoomId(room.id)

        // Get message history (initial load)
        const limit = 50
        const { messages: chatMessages, total } = await chatService.getChatMessages(
          room.id,
          limit,
          0
        )
        setMessages(chatMessages)
        setOffset(chatMessages.length)
        setHasMoreMessages(chatMessages.length < total)
      } catch (err) {
        console.error('Failed to load chat room:', err)
        setError(t('loadChatFailed'))
      } finally {
        setLoading(false)
      }
    }

    loadChatRoom()
  }, [activityId])

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!roomId || loadingMore || !hasMoreMessages) return

    try {
      setLoadingMore(true)
      const limit = 50
      const { messages: olderMessages, total } = await chatService.getChatMessages(
        roomId,
        limit,
        offset
      )

      if (olderMessages.length > 0) {
        // Prepend older messages
        setMessages((prev) => [...olderMessages, ...prev])
        setOffset((prev) => prev + olderMessages.length)
        setHasMoreMessages(offset + olderMessages.length < total)
      } else {
        setHasMoreMessages(false)
      }
    } catch (err) {
      console.error('Failed to load more messages:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  // Handle scroll to load more messages
  const handleScroll = () => {
    if (!messagesContainerRef.current) return

    const { scrollTop } = messagesContainerRef.current

    // Load more when scrolled near the top
    if (scrollTop < 100 && hasMoreMessages && !loadingMore) {
      loadMoreMessages()
    }
  }

  // Setup socket connection and event listeners
  useEffect(() => {
    if (!roomId) return

    let mounted = true
    const setupSocket = async () => {
      try {
        // Connect socket and wait for connection
        await socketService.connectAndWait()
        if (!mounted) return

        // Join room (socket is now connected)
        socketService.joinRoom(roomId)

        // Listen for new messages
      const handleMessageReceived = (message: MessageReceivedPayload) => {
        const newMessage: ChatMessage = {
          id: message.id,
          chatRoomId: message.chatRoomId,
          senderId: message.senderId,
          senderName: message.senderName,
          content: message.content,
          timestamp: new Date(message.timestamp),
        }
        
        // Check if message already exists (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === newMessage.id)
          if (exists) return prev
          return [...prev, newMessage]
        })

        // Increment unread count if message is from another user and chat is not visible
        if (message.senderId !== user?.id && !isVisible) {
          setUnreadCount((prev) => {
            const newCount = prev + 1
            onUnreadCountChange?.(newCount)
            return newCount
          })

          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message', {
              body: `${message.senderName}: ${message.content}`,
            })
          }
        }
      }

      // Listen for user joined
      const handleUserJoined = (data: { userId: string; displayName: string }) => {
        console.log(`${data.displayName} joined the chat`)
        // Could show a system message here
      }

      // Listen for user left
      const handleUserLeft = (data: { userId: string }) => {
        console.log(`User ${data.userId} left the chat`)
        // Could show a system message here
      }

      // Listen for user typing
      const handleUserTyping = (data: { userId: string; displayName: string }) => {
        if (data.userId !== user?.id) {
          setTypingUsers((prev) => {
            const newMap = new Map(prev)
            newMap.set(data.userId, data.displayName)
            return newMap
          })
        }
      }

      // Listen for user stop typing
      const handleUserStopTyping = (data: { userId: string }) => {
        setTypingUsers((prev) => {
          const newMap = new Map(prev)
          newMap.delete(data.userId)
          return newMap
        })
      }

        socketService.onMessageReceived(handleMessageReceived)
        socketService.onUserJoined(handleUserJoined)
        socketService.onUserLeft(handleUserLeft)
        socketService.onUserTyping(handleUserTyping)
        socketService.onUserStopTyping(handleUserStopTyping)
      } catch (err) {
        if (mounted) {
          console.error('Failed to setup socket connection:', err)
          setError(t('connectChatFailed'))
        }
      }
    }

    setupSocket()

    // Cleanup on unmount
    return () => {
      mounted = false
      try {
        if (roomId && socketService.isConnected()) {
          socketService.leaveRoom(roomId)
        }
      } catch {
        // Socket may have disconnected
      }
      socketService.off('message_received')
      socketService.off('user_joined')
      socketService.off('user_left')
      socketService.off('user_typing')
      socketService.off('user_stop_typing')
    }
  }, [roomId])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Paper elevation={2} sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{t('activityChatTitle')}</Typography>
      </Box>

      {/* Messages list */}
      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}
      >
        {loadingMore && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {t('noMessagesYet')}
          </Typography>
        ) : (
          <List>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderId === user?.id
              const showDivider = index < messages.length - 1

              return (
                <React.Fragment key={message.id}>
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                      py: 1,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        bgcolor: isOwnMessage ? 'primary.main' : 'action.hover',
                        color: isOwnMessage ? 'white' : 'text.primary',
                        borderRadius: 2,
                        p: 1.5,
                      }}
                    >
                      {!isOwnMessage && (
                        <Typography variant="caption" fontWeight="bold" display="block">
                          {message.senderName}
                        </Typography>
                      )}
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          opacity: 0.8,
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </ListItem>
                  {showDivider && <Divider variant="inset" component="li" />}
                </React.Fragment>
              )
            })}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            {Array.from(typingUsers.values()).join(', ')} {t('typing')}...
          </Typography>
        </Box>
      )}

      {/* Message input */}
      {roomId && <MessageInput roomId={roomId} />}
    </Paper>
  )
}
