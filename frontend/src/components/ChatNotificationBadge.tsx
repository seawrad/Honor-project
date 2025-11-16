import React from 'react'
import { Badge, IconButton } from '@mui/material'
import ChatIcon from '@mui/icons-material/Chat'

interface ChatNotificationBadgeProps {
  unreadCount: number
  onClick?: () => void
}

export const ChatNotificationBadge: React.FC<ChatNotificationBadgeProps> = ({
  unreadCount,
  onClick,
}) => {
  return (
    <IconButton color="inherit" onClick={onClick}>
      <Badge badgeContent={unreadCount} color="error">
        <ChatIcon />
      </Badge>
    </IconButton>
  )
}
