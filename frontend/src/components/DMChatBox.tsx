import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDMChat } from '../contexts/DMChatContext';
import { dmService, DMMessage } from '../services/dm.service';
import { socketService } from '../services/socket.service';
import { MessageInput } from './MessageInput';
import { useAuth } from '../hooks/useAuth';
import { MessageReceivedPayload } from '../types/chat.types';

export const DMChatBox: React.FC = () => {
  const { activeRoom, closeChat } = useDMChat();
  const { user } = useAuth();
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMessageSent = (content: string) => {
    if (!user || !activeRoom) return;
    const optimisticMsg: DMMessage = {
      id: `opt-${Date.now()}`,
      dmRoomId: activeRoom.id,
      senderId: user.id,
      senderName: user.displayName || '',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => {
      if (prev.some((m) => m.senderId === user.id && m.content === content && !m.id.startsWith('opt-'))) {
        return prev;
      }
      return [...prev, optimisticMsg];
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!activeRoom) return;

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { messages: msgs } = await dmService.getMessages(activeRoom.id);
        if (mounted) setMessages(msgs);
      } catch (err) {
        if (mounted) {
          setError('無法載入訊息');
          setMessages([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const setupSocket = async () => {
      try {
        await socketService.connectAndWait();
        if (!mounted) return;
        socketService.joinRoom(activeRoom.id);

        const handleMessage = (payload: MessageReceivedPayload) => {
          const newMsg: DMMessage = {
            id: payload.id,
            dmRoomId: payload.chatRoomId,
            senderId: payload.senderId,
            senderName: payload.senderName,
            content: payload.content,
            timestamp: payload.timestamp,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Replace optimistic message from self with real one
            if (payload.senderId === user?.id) {
              const filtered = prev.filter((m) => !(m.id.startsWith('opt-') && m.content === newMsg.content));
              return [...filtered, newMsg];
            }
            return [...prev, newMsg];
          });
        };

        socketService.onMessageReceived(handleMessage);

        return () => {
          socketService.leaveRoom(activeRoom.id);
          socketService.off('message_received');
        };
      } catch (err) {
        console.error('Socket setup failed:', err);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
      try {
        if (socketService.isConnected()) {
          socketService.leaveRoom(activeRoom.id);
        }
      } catch {
        // ignore
      }
    };
  }, [activeRoom?.id]);

  if (!activeRoom) return null;

  const formatTime = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 360,
        maxWidth: 'calc(100vw - 48px)',
        height: 480,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'hidden',
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <Avatar
            src={activeRoom.otherUser.avatarUrl || undefined}
            sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}
          >
            {!activeRoom.otherUser.avatarUrl && activeRoom.otherUser.displayName.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {activeRoom.otherUser.displayName}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={closeChat}
          sx={{ color: 'inherit' }}
          aria-label="關閉"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <Box
                  key={msg.id}
                  sx={{
                    alignSelf: isOwn ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isOwn ? 'primary.main' : 'grey.200',
                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        opacity: 0.8,
                      }}
                    >
                      {formatTime(msg.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      <MessageInput roomId={activeRoom.id} onMessageSent={handleMessageSent} />
    </Paper>
  );
};
