import React from 'react';
import { IconButton } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';

export const FriendChatButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IconButton
      color="inherit"
      aria-label="聊天"
      onClick={() => navigate('/chat-list')}
      sx={{
        ml: 0.5,
        bgcolor: 'rgba(255,255,255,0.15)',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.25)',
        },
      }}
    >
      <ChatIcon fontSize="medium" />
    </IconButton>
  );
};
