import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Alert,
  Button,
  Pagination,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityFilters as ActivityFiltersComponent } from '../components/ActivityFilters';
import { LoadingState } from '../components/LoadingState';
import { activityService } from '../services/activity.service';
import { Activity, ActivityFilters } from '../types/activity.types';

export const ActivityListPage = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<ActivityFilters>({});

  const limit = 12;

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await activityService.getActivities(filters, page, limit);
      setActivities(response.activities);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '載入活動失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [page, filters]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFiltersChange = (newFilters: ActivityFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState type="skeleton" count={6} />
      ) : activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
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
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {activities.map((activity) => (
              <Grid item xs={12} sm={6} md={4} key={activity.id}>
                <ActivityCard activity={activity} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};
