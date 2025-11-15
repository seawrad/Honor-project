import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  DirectionsRun,
  People,
  Person,
  ArrowBack,
  Edit,
  Cancel,
} from '@mui/icons-material';
import { ActivityMap } from '../components/ActivityMap';
import { activityService } from '../services/activity.service';
import { Activity } from '../types/activity.types';
import { useAuth } from '../hooks/useAuth';

export const ActivityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadActivity = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await activityService.getActivityById(id);
      setActivity(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '載入活動失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, [id]);

  const handleJoinActivity = async () => {
    if (!id || !activity) return;

    try {
      setActionLoading(true);
      await activityService.joinActivity(id);
      await loadActivity();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '加入活動失敗');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveActivity = async () => {
    if (!id || !activity) return;

    try {
      setActionLoading(true);
      await activityService.leaveActivity(id);
      await loadActivity();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '離開活動失敗');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !activity) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || '找不到活動'}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/activities')}
          sx={{ mt: 2 }}
        >
          返回列表
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isFull = activity.currentParticipants >= activity.maxParticipants;
  const isCreator = user?.id === activity.creatorId;
  const isParticipant = activity.participants.some(p => p.userId === user?.id);
  const canEdit = isCreator && new Date(activity.scheduledDate).getTime() - Date.now() > 3600000;

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'upcoming':
        return 'primary';
      case 'in-progress':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: Activity['status']) => {
    switch (status) {
      case 'upcoming':
        return '即將開始';
      case 'in-progress':
        return '進行中';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/activities')}
        sx={{ mb: 3 }}
      >
        返回列表
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {activity.title}
            </Typography>
            <Chip
              label={getStatusLabel(activity.status)}
              color={getStatusColor(activity.status)}
              sx={{ mr: 1 }}
            />
            {isFull && <Chip label="已滿" color="error" />}
          </Box>
          {isCreator && canEdit && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate(`/activities/${id}/edit`)}
              >
                編輯
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => navigate(`/activities/${id}/cancel`)}
              >
                取消活動
              </Button>
            </Box>
          )}
        </Box>

        <Typography variant="body1" paragraph>
          {activity.description}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarToday sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  活動時間
                </Typography>
                <Typography variant="body1">
                  {formatDate(activity.scheduledDate)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationOn sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  集合地點
                </Typography>
                <Typography variant="body1">
                  {activity.location.address}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DirectionsRun sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  距離
                </Typography>
                <Typography variant="body1">
                  {activity.distance} 公里
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  參加人數
                </Typography>
                <Typography variant="body1">
                  {activity.currentParticipants} / {activity.maxParticipants} 人
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  主辦人
                </Typography>
                <Typography variant="body1">
                  {activity.creatorName}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              路線說明
            </Typography>
            <Typography variant="body1" paragraph>
              {activity.route}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          活動地點
        </Typography>
        <ActivityMap location={activity.location} height={300} />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          參加者名單 ({activity.currentParticipants})
        </Typography>
        <List>
          {activity.participants.map((participant) => (
            <ListItem key={participant.userId}>
              <ListItemText
                primary={participant.displayName}
                secondary={`加入時間：${new Date(participant.joinedAt).toLocaleDateString('zh-TW')}`}
              />
            </ListItem>
          ))}
        </List>

        {!isCreator && activity.status === 'upcoming' && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {isParticipant ? (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleLeaveActivity}
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : '離開活動'}
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                onClick={handleJoinActivity}
                disabled={actionLoading || isFull}
              >
                {actionLoading ? <CircularProgress size={24} /> : isFull ? '活動已滿' : '加入活動'}
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};
