import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Alert,
  Button,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityFilters as ActivityFiltersComponent } from '../components/ActivityFilters';
import { ActivityCardSkeleton } from '../components/skeletons';
import { EmptyState } from '../components/EmptyState';
import { UserLocationMap } from '../components/UserLocationMap';
import { activityService } from '../services/activity.service';
import { Activity, ActivityFilters } from '../types/activity.types';
import { useToast } from '../components/ErrorToast';

const limit = 20;
const now = () => new Date();

export const ActivityListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [upcomingRaw, setUpcomingRaw] = useState<Activity[]>([]);
  const [completedRaw, setCompletedRaw] = useState<Activity[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [savedActivities, setSavedActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({});

  const upcomingActivities = useMemo(() => {
    return upcomingRaw
      .filter((a) => new Date(a.scheduledDate) >= now())
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [upcomingRaw]);

  const postActivities = useMemo(() => {
    const past = upcomingRaw
      .filter((a) => new Date(a.scheduledDate) < now())
      .map((a) => ({ ...a }));
    const merged = [...completedRaw, ...past];
    return merged.sort(
      (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    );
  }, [upcomingRaw, completedRaw]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const [upResp, compResp, ids, saved] = await Promise.all([
        activityService.getActivities({ ...filters, status: 'upcoming' }, 1, limit),
        activityService.getActivities({ ...filters, status: 'completed' }, 1, limit),
        activityService.getBookmarkedIds().catch(() => []),
        activityService.getBookmarkedActivities().catch(() => []),
      ]);
      setUpcomingRaw(upResp.activities);
      setCompletedRaw(compResp.activities);
      setBookmarkedIds(new Set(ids));
      setSavedActivities(saved);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('loadActivitiesFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = async (activityId: string, bookmarked: boolean) => {
    try {
      if (bookmarked) {
        await activityService.bookmarkActivity(activityId);
        setBookmarkedIds((prev) => new Set([...prev, activityId]));
        const act = [...upcomingActivities, ...postActivities].find((a) => a.id === activityId);
        if (act && !savedActivities.some((a) => a.id === activityId)) {
          setSavedActivities((prev) => [act, ...prev]);
        }
        showToast(t('saved'), 'success');
      } else {
        await activityService.unbookmarkActivity(activityId);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(activityId);
          return next;
        });
        setSavedActivities((prev) => prev.filter((a) => a.id !== activityId));
        showToast(t('unbookmark'), 'info');
      }
    } catch {
      showToast(t('loadFailed'), 'error');
    }
  };

  useEffect(() => {
    loadActivities();
  }, [filters]);

  const handleFiltersChange = (newFilters: ActivityFilters) => {
    setFilters(newFilters);
  };

  const hasAnyActivities = upcomingActivities.length > 0 || postActivities.length > 0;
  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          {t('runningActivities')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/activities/create')}
        >
          {t('createActivityBtn')}
        </Button>
      </Box>

      <ActivityFiltersComponent onFiltersChange={handleFiltersChange} />

      <UserLocationMap height={280} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !hasAnyActivities ? (
        <EmptyState
          variant="no-activities"
          title={hasActiveFilters ? t('noMatchingActivities') : t('noActivitiesYet')}
          description={hasActiveFilters ? t('tryAdjustFilters') : t('beFirstToCreate')}
          actionLabel={hasActiveFilters ? undefined : t('createActivityBtn')}
          onAction={hasActiveFilters ? undefined : () => navigate('/activities/create')}
        />
      ) : loading ? (
        <>
          <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 2 }}>
            {t('upcomingActivitiesSection')}
          </Typography>
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <ActivityCardSkeleton />
              </Grid>
            ))}
          </Grid>
          <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 4 }}>
            {t('pastActivitiesSection')}
          </Typography>
          <Grid container spacing={3}>
            {[1, 2, 3].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <ActivityCardSkeleton />
              </Grid>
            ))}
          </Grid>
        </>
      ) : (
        <>
          {/* Saved activities section */}
          {savedActivities.length > 0 && (
            <>
              <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 2 }}>
                {t('savedActivities')}
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {savedActivities.map((activity) => (
                  <Grid item xs={12} sm={6} md={4} key={activity.id}>
                    <ActivityCard
                      activity={activity}
                      isBookmarked={true}
                      onBookmarkToggle={handleBookmarkToggle}
                    />
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          {/* Upcoming activities section */}
          <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 2 }}>
            {t('upcomingActivitiesSection')}
          </Typography>
          <Grid container spacing={3}>
            {upcomingActivities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <ActivityCard
                  activity={activity}
                  isBookmarked={bookmarkedIds.has(activity.id)}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              </Grid>
            ))}
          </Grid>

          {upcomingActivities.length === 0 && postActivities.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('noUpcomingNow')}
            </Typography>
          )}

          {/* Post activities section */}
          <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 4 }}>
            {t('pastActivitiesSection')}
          </Typography>
          <Grid container spacing={3}>
            {postActivities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <ActivityCard
                  activity={activity}
                  isBookmarked={bookmarkedIds.has(activity.id)}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              </Grid>
            ))}
          </Grid>

          {postActivities.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('noPastActivities')}
            </Typography>
          )}
        </>
      )}
    </Container>
  );
};
