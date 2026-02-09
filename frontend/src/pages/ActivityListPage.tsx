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
import { ActivityCard } from '../components/ActivityCard';
import { ActivityFilters as ActivityFiltersComponent } from '../components/ActivityFilters';
import { LoadingState } from '../components/LoadingState';
import { UserLocationMap } from '../components/UserLocationMap';
import { activityService } from '../services/activity.service';
import { Activity, ActivityFilters } from '../types/activity.types';

const limit = 20;
const now = () => new Date();

export const ActivityListPage = () => {
  const navigate = useNavigate();
  const [upcomingRaw, setUpcomingRaw] = useState<Activity[]>([]);
  const [completedRaw, setCompletedRaw] = useState<Activity[]>([]);
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
      const [upResp, compResp] = await Promise.all([
        activityService.getActivities({ ...filters, status: 'upcoming' }, 1, limit),
        activityService.getActivities({ ...filters, status: 'completed' }, 1, limit),
      ]);
      setUpcomingRaw(upResp.activities);
      setCompletedRaw(compResp.activities);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '載入活動失敗');
    } finally {
      setLoading(false);
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
          跑步活動
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/activities/create')}
        >
          建立活動
        </Button>
      </Box>

      <ActivityFiltersComponent onFiltersChange={handleFiltersChange} />

      <UserLocationMap height={280} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState type="skeleton" count={6} />
      ) : !hasAnyActivities ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          {hasActiveFilters ? (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                沒有符合條件的活動
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                試試調整篩選條件或重置篩選
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                目前沒有活動
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                成為第一個建立跑步活動的人！
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/activities/create')}
              >
                建立活動
              </Button>
            </>
          )}
        </Box>
      ) : (
        <>
          {/* Upcoming activities section */}
          <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 2 }}>
            即將開始的活動
          </Typography>
          <Grid container spacing={3}>
            {upcomingActivities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <ActivityCard activity={activity} />
              </Grid>
            ))}
          </Grid>

          {upcomingActivities.length === 0 && postActivities.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              目前沒有即將開始的活動
            </Typography>
          )}

          {/* Post activities section */}
          <Typography variant="h6" component="h2" sx={{ mb: 2, mt: 4 }}>
            過往活動
          </Typography>
          <Grid container spacing={3}>
            {postActivities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <ActivityCard activity={activity} />
              </Grid>
            ))}
          </Grid>

          {postActivities.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              尚無過往活動
            </Typography>
          )}
        </>
      )}
    </Container>
  );
};
