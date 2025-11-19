import React, { useState, useEffect, useRef } from 'react'
import { Box, TextField, IconButton, Alert } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { socketService } from '../services/socket.service'

interface MessageInputProps {
  roomId: string
}

export const MessageInput: React.FC<MessageInputProps> = ({ roomId }) => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
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
      setError('Not connected to chat. Please refresh the page.')
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

      // Send message via WebSocket
      socketService.sendMessage(roomId, message.trim())

      // Clear input
      setMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message. Please try again.')
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

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 1, p: 2, borderTop: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          placeholder="Type a message..."
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
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  )
}
