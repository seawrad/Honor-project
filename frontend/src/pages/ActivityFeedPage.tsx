import React, { useEffect, useState, useCallback } from 'react';
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
import { activityService } from '../services/activity.service';
import { Activity } from '../types/activity.types';
import { ActivityCard } from '../components/ActivityCard';

export const ActivityFeedPage: React.FC = () => {
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
      setError(err.response?.data?.error?.message || '無法載入活動動態');
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

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">活動動態</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            重新整理
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activities.length === 0 && !error && (
          <Alert severity="info">
            目前沒有活動動態。追蹤其他使用者以查看他們的活動！
          </Alert>
        )}

        {activities.length > 0 && (
          <>
            <Grid container spacing={3}>
              {activities.map((activity) => (
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
                  已載入所有活動
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};
