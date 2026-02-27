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
  IconButton,
  Tooltip,
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
  Chat,
  Star,
  PlayArrow,
  Bookmark,
  BookmarkBorder,
} from '@mui/icons-material';
import { ActivityMap } from '../components/ActivityMap';
import { RatingDialog } from '../components/RatingDialog';
import { ActivityRatings } from '../components/ActivityRatings';
import { ActivityDetailSkeleton } from '../components/skeletons';
import { activityService } from '../services/activity.service';
import { Activity } from '../types/activity.types';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/ErrorToast';

export const ActivityDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const loadActivity = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await activityService.getActivityById(id);
      setActivity(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('loadActivityFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, [id]);

  useEffect(() => {
    const checkBookmark = async () => {
      if (!id || !user) return;
      try {
        const ids = await activityService.getBookmarkedIds();
        setIsBookmarked(ids.includes(id));
      } catch {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [id, user]);

  useEffect(() => {
    // Check if user has already rated this activity
    const checkRatingStatus = async () => {
      if (!id || !user || !activity || activity.status !== 'completed') return;
      
      try {
        const ratingsData = await activityService.getActivityRatings(id);
        const userRating = ratingsData.ratings.find((r: any) => r.userId === user.id);
        setHasRated(!!userRating);
      } catch (err) {
        // Ignore error
      }
    };

    checkRatingStatus();
  }, [id, user, activity]);

  const handleJoinActivity = async () => {
    if (!id || !activity) return;

    try {
      setActionLoading(true);
      await activityService.joinActivity(id);
      await loadActivity();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('joinActivityFailed'));
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
      setError(err.response?.data?.error?.message || t('leaveActivityFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRating = async (rating: number, feedback?: string) => {
    if (!id) return;

    await activityService.createRating(id, { rating, feedback });
    setHasRated(true);
  };

  if (!loading && (error || !activity)) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error || t('activityNotFound')}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/activities')}
          sx={{ mt: 2 }}
        >
          {t('backToList')}
        </Button>
      </Container>
    );
  }

  if (loading || !activity) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/activities')} sx={{ mb: 3 }}>
          {t('backToList')}
        </Button>
        <ActivityDetailSkeleton />
      </Container>
    );
  }

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

  const handleBookmarkToggle = async () => {
    if (!id) return;
    try {
      if (isBookmarked) {
        await activityService.unbookmarkActivity(id);
        setIsBookmarked(false);
        showToast(t('unbookmark'), 'info');
      } else {
        await activityService.bookmarkActivity(id);
        setIsBookmarked(true);
        showToast(t('saved'), 'success');
      }
    } catch {
      showToast(t('loadFailed'), 'error');
    }
  };

  const getStatusLabel = (status: Activity['status']) => {
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/activities')}
        sx={{ mb: 3 }}
      >
        {t('backToList')}
      </Button>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h4" component="h1">
                {activity.title}
              </Typography>
              <Tooltip title={isBookmarked ? t('unbookmark') : t('bookmark')}>
                <IconButton onClick={handleBookmarkToggle} color={isBookmarked ? 'primary' : 'default'} size="small">
                  {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              </Tooltip>
            </Box>
            <Chip
              label={(activity.activityType ?? 'route-based') === 'time-based' ? t('timeBased') : t('routeBased')}
              variant="outlined"
              sx={{ mr: 1 }}
            />
            <Chip
              label={getStatusLabel(activity.status)}
              color={getStatusColor(activity.status)}
              sx={{ mr: 1 }}
            />
            {isFull && <Chip label={t('full')} color="error" />}
          </Box>
          {isCreator && canEdit && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => navigate(`/activities/${id}/edit`)}
              >
                {t('edit')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => navigate(`/activities/${id}/cancel`)}
              >
                {t('cancelActivity')}
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
                  {t('activityTime')}
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
                  {t('meetingPoint')}
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
                  {t('distance')}
                </Typography>
                <Typography variant="body1">
                  {activity.distance} {t('kmShort')}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('participants')}
                </Typography>
                <Typography variant="body1">
                  {activity.currentParticipants} / {activity.maxParticipants} {t('people')}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 2, color: 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('organizer')}
                </Typography>
                <Typography variant="body1">
                  {activity.creatorName}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('routeDescription')}
            </Typography>
            <Typography variant="body1" paragraph>
              {activity.route}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          {t('activityLocation')}
        </Typography>
        <ActivityMap location={activity.location} height={300} />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          {t('participantList')} ({activity.currentParticipants})
        </Typography>
        <List>
          {activity.participants.map((participant) => (
            <ListItem key={participant.userId}>
              <ListItemText
                primary={participant.displayName}
                secondary={`${t('joinedAt')}: ${new Date(participant.joinedAt).toLocaleDateString(locale)}`}
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
                {actionLoading ? <CircularProgress size={24} /> : t('leaveActivity')}
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                onClick={handleJoinActivity}
                disabled={actionLoading || isFull}
              >
                {actionLoading ? <CircularProgress size={24} /> : isFull ? t('activityFull') : t('joinActivity')}
              </Button>
            )}
          </Box>
        )}

        {(isCreator || isParticipant) && (activity.status === 'upcoming' || activity.status === 'in-progress') && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<PlayArrow />}
              onClick={() => navigate(`/activities/${id}/tracking`)}
              color={isCreator ? 'primary' : 'secondary'}
            >
              {isCreator
                ? activity.status === 'in-progress'
                  ? t('continueRun')
                  : t('startRun')
                : activity.status === 'in-progress'
                  ? t('monitorRun')
                  : t('joinRun')}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Chat />}
              onClick={() => navigate(`/activities/${id}/chat`)}
            >
              {t('openChatRoom')}
            </Button>
          </Box>
        )}

        {isParticipant && activity.status === 'completed' && !hasRated && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('activityCompletedRate')}
            </Alert>
            <Button
              variant="contained"
              fullWidth
              startIcon={<Star />}
              onClick={() => setRatingDialogOpen(true)}
            >
              {t('rateActivity')}
            </Button>
          </Box>
        )}

        {isParticipant && activity.status === 'completed' && hasRated && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success">
              {t('thanksForRating')}
            </Alert>
          </Box>
        )}
      </Paper>

      {/* Show ratings for completed activities */}
      {activity.status === 'completed' && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <ActivityRatings activityId={activity.id} />
        </Paper>
      )}

      <RatingDialog
        open={ratingDialogOpen}
        onClose={() => setRatingDialogOpen(false)}
        onSubmit={handleSubmitRating}
        activityTitle={activity.title}
      />
    </Container>
  );
};
