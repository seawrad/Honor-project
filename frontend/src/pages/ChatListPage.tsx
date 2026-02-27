import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { useTranslation } from 'react-i18next';
import { activityService } from '../services/activity.service';
import { userService } from '../services/user.service';
import { dmService } from '../services/dm.service';
import { useDMChat } from '../contexts/DMChatContext';
import { Activity } from '../types/activity.types';
import { ChatListItemSkeleton } from '../components/skeletons';
import { EmptyState } from '../components/EmptyState';

interface Friend {
  id: string;
  displayName: string;
}

export const ChatListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openChat } = useDMChat();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await activityService.getActivities({}, 1, 50);
        setActivities(response.activities);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || t('loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        setFriendsLoading(true);
        const data = await userService.getFriends();
        setFriends(data);
      } catch {
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    };
    loadFriends();
  }, []);

  const handleFriendClick = async (friend: Friend) => {
    try {
      const room = await dmService.getOrCreateRoom(friend.id);
      openChat(room);
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ChatIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5">{t('chatTitle')}</Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<GroupIcon />} iconPosition="start" label={t('activityChat')} />
        <Tab icon={<PersonIcon />} iconPosition="start" label={t('friendChat')} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {!loading && activities.length === 0 ? (
            <EmptyState
              variant="no-chat"
              title={t('noActivityChats')}
              actionLabel={t('exploreActivities')}
              onAction={() => navigate('/activities')}
            />
          ) : loading ? (
            <List disablePadding>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ChatListItemSkeleton key={i} />
              ))}
            </List>
          ) : (
            <List disablePadding>
              {activities.map((activity) => (
                <ListItem key={activity.id} disablePadding divider>
                  <ListItemButton
                    onClick={() => navigate(`/activities/${activity.id}/chat`)}
                  >
                    <ListItemText
                      primary={activity.title}
                      secondary={`${activity.creatorName} · ${activity.currentParticipants}/${activity.maxParticipants} ${t('people')}`}
                    />
                    <ChatIcon color="action" />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {!friendsLoading && friends.length === 0 ? (
            <EmptyState
              variant="no-friends"
              title={t('noFriendsChat')}
              actionLabel={t('searchUsers')}
              onAction={() => navigate('/users/search')}
            />
          ) : friendsLoading ? (
            <List disablePadding>
              {[1, 2, 3, 4, 5].map((i) => (
                <ChatListItemSkeleton key={i} />
              ))}
            </List>
          ) : (
            <List disablePadding>
              {friends.map((friend) => (
                <ListItem key={friend.id} disablePadding divider>
                  <ListItemButton onClick={() => handleFriendClick(friend)}>
                    <ListItemText primary={friend.displayName} />
                    <ChatIcon color="action" />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}
    </Container>
  );
};
