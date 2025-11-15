import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  DirectionsRun,
  People,
} from '@mui/icons-material';
import { Activity } from '../types/activity.types';
import { useNavigate } from 'react-router-dom';

interface ActivityCardProps {
  activity: Activity;
}

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const navigate = useNavigate();

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
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {activity.title}
          </Typography>
          <Chip
            label={getStatusLabel(activity.status)}
            color={getStatusColor(activity.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {activity.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarToday sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(activity.scheduledDate)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {activity.location.address}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DirectionsRun sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {activity.distance} 公里
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {activity.currentParticipants} / {activity.maxParticipants} 人
          </Typography>
          {isFull && (
            <Chip label="已滿" color="error" size="small" sx={{ ml: 1 }} />
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          主辦人：{activity.creatorName}
        </Typography>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          onClick={() => navigate(`/activities/${activity.id}`)}
          fullWidth
        >
          查看詳情
        </Button>
      </CardActions>
    </Card>
  );
};
