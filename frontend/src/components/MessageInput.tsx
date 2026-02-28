import React, { useState, useEffect, useRef } from 'react'
import { Box, TextField, IconButton, Alert, Popover } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { useTranslation } from 'react-i18next'
import { socketService } from '../services/socket.service'

interface MessageInputProps {
  roomId: string
  /** Optional: called when message is sent (for optimistic update) */
  onMessageSent?: (content: string) => void
}

export const MessageInput: React.FC<MessageInputProps> = ({ roomId, onMessageSent }) => {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLButtonElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle typing indicator
  useEffect(() => {
    return () => {
      // Cleanup: stop typing on unmount
      if (isTyping) {
        socketService.emitStopTyping(roomId)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [roomId, isTyping])

  const handleTyping = () => {
    if (!socketService.isConnected()) return

    // Emit typing event if not already typing
    if (!isTyping) {
      socketService.emitTyping(roomId)
      setIsTyping(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emitStopTyping(roomId)
      setIsTyping(false)
    }, 3000)
  }

  const handleSendMessage = async () => {
    if (!message.trim()) {
      return
    }

    if (!socketService.isConnected()) {
      setError(t('notConnected'))
      return
    }

    try {
      setIsSending(true)
      setError(null)

      // Stop typing indicator
      if (isTyping) {
        socketService.emitStopTyping(roomId)
        setIsTyping(false)
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      const content = message.trim()
      // Send message via WebSocket
      socketService.sendMessage(roomId, content)

      // Optimistic update: show message immediately
      onMessageSent?.(content)

      // Clear input
      setMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
      setError(t('sendFailed'))
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji)
    handleTyping()
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 0.5, p: 2, borderTop: 1, borderColor: 'divider' }}>
        <IconButton
          size="small"
          onClick={(e) => setEmojiAnchor(emojiAnchor ? null : e.currentTarget)}
          sx={{ alignSelf: 'flex-end', color: 'text.secondary' }}
          aria-label="Insert emoji"
        >
          <EmojiEmotionsIcon />
        </IconButton>
        <Popover
          open={Boolean(emojiAnchor)}
          anchorEl={emojiAnchor}
          onClose={() => setEmojiAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </Popover>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder={t('messagePlaceholder')}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            handleTyping()
          }}
          onKeyPress={handleKeyPress}
          disabled={isSending}
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending}
          sx={{ alignSelf: 'flex-end' }}
          aria-label="Send"
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  )
}
