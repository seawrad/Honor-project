import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  DirectionsRun,
  People,
  Bookmark,
  BookmarkBorder,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Activity } from '../types/activity.types';
import { useNavigate } from 'react-router-dom';

interface ActivityCardProps {
  activity: Activity;
  isBookmarked?: boolean;
  onBookmarkToggle?: (activityId: string, bookmarked: boolean) => void;
}

export const ActivityCard = ({ activity, isBookmarked = false, onBookmarkToggle }: ActivityCardProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === 'en' ? 'en-US' : 'zh-TW';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
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

  const isPast = new Date(activity.scheduledDate) < new Date();

  const getStatusLabel = (status: Activity['status']) => {
    if (status === 'upcoming' && isPast) return t('ended');
    switch (status) {
      case 'upcoming':
        return t('statusUpcoming');
      case 'in-progress':
        return t('statusInProgress');
      case 'completed':
        return t('statusCompleted');
      case 'cancelled':
        return t('statusCancelled');
      default:
        return status;
    }
  };

  const getDisplayStatusColor = () => {
    if (activity.status === 'upcoming' && isPast) return 'default';
    return getStatusColor(activity.status);
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
            {onBookmarkToggle && (
              <Tooltip title={isBookmarked ? t('unbookmark') : t('bookmark')}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle(activity.id, !isBookmarked);
                  }}
                  color={isBookmarked ? 'primary' : 'default'}
                  sx={{ p: 0.5 }}
                >
                  {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              </Tooltip>
            )}
            <Chip
              label={(activity.activityType ?? 'route-based') === 'time-based' ? t('timeBased') : t('routeBased')}
              size="small"
              variant="outlined"
              sx={{ flexShrink: 0 }}
            />
            <Chip
              label={getStatusLabel(activity.status)}
              color={getDisplayStatusColor()}
              size="small"
              sx={{ flexShrink: 0 }}
            />
          </Box>
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
            {activity.distance} {t('kmShort')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <People sx={{ fontSize: { xs: 16, sm: 18 }, mr: 1, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {activity.currentParticipants} / {activity.maxParticipants} {t('people')}
            </Typography>
          </Box>
          {isFull && (
            <Chip label={t('full')} color="error" size="small" />
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
          {t('creator')}：{activity.creatorName}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Button
          size="small"
          onClick={() => navigate(`/activities/${activity.id}`)}
          fullWidth
          sx={{ minHeight: 44 }}
        >
          {t('viewDetails')}
        </Button>
      </CardActions>
    </Card>
  );
};
