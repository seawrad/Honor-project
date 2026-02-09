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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import { activityService } from '../services/activity.service';
import { Activity } from '../types/activity.types';

export const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <ChatIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5">聊天列表</Typography>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
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
        <List>
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
    </Container>
  );
};
