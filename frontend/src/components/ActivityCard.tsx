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
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
          <Typography 
            variant="h6" 
            component="h2" 
            gutterBottom
            sx={{
              fontSize: { xs: '1rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {activity.title}
          </Typography>
          <Chip
            label={getStatusLabel(activity.status)}
            color={getStatusColor(activity.status)}
            size="small"
            sx={{ flexShrink: 0 }}
          />
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {activity.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CalendarToday sx={{ fontSize: { xs: 16, sm: 18 }, mr: 1, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {formatDate(activity.scheduledDate)}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn sx={{ fontSize: { xs: 16, sm: 18 }, mr: 1, color: 'text.secondary', flexShrink: 0 }} />
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {activity.location.address}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <DirectionsRun sx={{ fontSize: { xs: 16, sm: 18 }, mr: 1, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {activity.distance} 公里
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <People sx={{ fontSize: { xs: 16, sm: 18 }, mr: 1, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {activity.currentParticipants} / {activity.maxParticipants} 人
            </Typography>
          </Box>
          {isFull && (
            <Chip label="已滿" color="error" size="small" />
          )}
        </Box>

        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            mt: 1, 
            display: 'block',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
          }}
        >
          主辦人：{activity.creatorName}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Button
          size="small"
          onClick={() => navigate(`/activities/${activity.id}`)}
          fullWidth
          sx={{ minHeight: 44 }}
        >
          查看詳情
        </Button>
      </CardActions>
    </Card>
  );
};
