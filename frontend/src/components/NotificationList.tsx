import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  CircularProgress,
  Button,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../hooks/useNotifications';
import { Notification, NotificationType } from '../types/notification.types';
import { useNavigate } from 'react-router-dom';

interface NotificationListProps {
  onClose: () => void;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'activity_reminder':
      return <EventIcon color="primary" />;
    case 'activity_cancelled':
      return <CancelIcon color="error" />;
    case 'new_message':
    case 'chat_message':
      return <MessageIcon color="info" />;
    case 'new_follower':
      return <PersonAddIcon color="success" />;
    case 'activity_joined':
      return <GroupAddIcon color="success" />;
    default:
      return <EventIcon />;
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const locale = i18n.language === 'en' ? 'en-US' : 'zh-TW';

  if (diffMins < 1) return i18n.t('justNow');
  if (diffMins < 60) return i18n.t('minutesAgo', { count: diffMins });
  if (diffHours < 24) return i18n.t('hoursAgo', { count: diffHours });
  if (diffDays < 7) return i18n.t('daysAgo', { count: diffDays });
  
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
};

export const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate to related resource
    if (notification.relatedId) {
      switch (notification.type) {
        case 'activity_reminder':
        case 'activity_cancelled':
        case 'activity_joined':
          navigate(`/activities/${notification.relatedId}`);
          break;
        case 'new_message':
        case 'chat_message':
          navigate(`/activities/${notification.relatedId}/chat`);
          break;
        case 'new_follower':
          navigate(`/users/${notification.relatedId}`);
          break;
      }
    }

    onClose();
  };

  const handleDelete = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">{t('noNotifications')}</Typography>
      </Box>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  return (
    <Box>
      {unreadNotifications.length > 0 && (
        <>
          <Box sx={{ px: 2, py: 1 }}>
            <Button
              size="small"
              onClick={markAllAsRead}
              fullWidth
              variant="outlined"
            >
              {t('markAllAsRead')}
            </Button>
          </Box>
          <Divider />
        </>
      )}

      <List
        sx={{
          maxHeight: 450,
          overflow: 'auto',
          p: 0,
        }}
      >
        {notifications.map((notification) => (
          <ListItem
            key={notification.id}
            button
            onClick={() => handleNotificationClick(notification)}
            sx={{
              bgcolor: notification.isRead ? 'transparent' : 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={(e) => handleDelete(e, notification.id)}
                size="small"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {getNotificationIcon(notification.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  fontWeight={notification.isRead ? 'normal' : 'bold'}
                >
                  {notification.title}
                </Typography>
              }
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {formatTimestamp(notification.createdAt)}
                  </Typography>
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
