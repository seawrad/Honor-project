import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { activityService } from '../services/activity.service';
import { Activity } from '../types/activity.types';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityCardSkeleton } from '../components/skeletons';
import { EmptyState } from '../components/EmptyState';

export const ActivityFeedPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchActivities = useCallback(async (pageNum: number, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await activityService.getFollowingActivities(pageNum, 20);
      
      if (append) {
        setActivities((prev) => [...prev, ...response.activities]);
      } else {
        setActivities(response.activities);
      }

      setHasMore(response.activities.length === 20);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('loadFeedFailed'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage, true);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchActivities(1, false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100
      ) {
        if (!isLoadingMore && hasMore) {
          handleLoadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore, page]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">{t('activityFeed')}</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {t('refresh')}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isLoading && activities.length === 0 && !error && (
          <EmptyState
            variant="no-feed"
            title={t('noFeedYet')}
            actionLabel={t('exploreActivities')}
            onAction={() => navigate('/activities')}
          />
        )}

        {(activities.length > 0 || isLoading) && (
          <>
            <Grid container spacing={3}>
              {isLoading && activities.length === 0
                ? [1, 2, 3, 4, 5, 6].map((i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <ActivityCardSkeleton />
                    </Grid>
                  ))
                : activities.map((activity) => (
                    <Grid item xs={12} sm={6} md={4} key={activity.id}>
                      <ActivityCard activity={activity} />
                    </Grid>
                  ))}
            </Grid>

            {isLoadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {!hasMore && activities.length > 0 && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('allActivitiesLoaded')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};
