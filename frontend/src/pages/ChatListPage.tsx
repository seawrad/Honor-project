import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import { activityService } from '../services/activity.service';
import { userService } from '../services/user.service';
import { dmService } from '../services/dm.service';
import { useDMChat } from '../contexts/DMChatContext';
import { Activity } from '../types/activity.types';

interface Friend {
  id: string;
  displayName: string;
}

export const ChatListPage: React.FC = () => {
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
        setError(err.response?.data?.error?.message || '載入失敗');
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <ChatIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5">聊天</Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<GroupIcon />} iconPosition="start" label="活動聊天" />
        <Tab icon={<PersonIcon />} iconPosition="start" label="好友聊天" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {activities.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary" paragraph>
                尚無加入的活動聊天室。加入活動後，即可在此查看並進入聊天。
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/activities')}
              >
                探索活動
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {activities.map((activity) => (
                <ListItem key={activity.id} disablePadding divider>
                  <ListItemButton
                    onClick={() => navigate(`/activities/${activity.id}/chat`)}
                  >
                    <ListItemText
                      primary={activity.title}
                      secondary={`${activity.creatorName} · ${activity.currentParticipants}/${activity.maxParticipants} 人`}
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
          {friendsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : friends.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary" paragraph>
                尚無好友。互追後即可在此與好友傳訊息。
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/users/search')}
              >
                搜尋用戶
              </Button>
            </Box>
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
