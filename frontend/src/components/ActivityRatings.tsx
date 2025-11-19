import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Rating,
  LinearProgress,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { Star } from '@mui/icons-material';
import { activityService } from '../services/activity.service';
import { RatingsList } from './RatingsList';

interface ActivityRatingsProps {
  activityId: string;
}

export const ActivityRatings: React.FC<ActivityRatingsProps> = ({ activityId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingsData, setRatingsData] = useState<{
    averageRating: number;
    totalRatings: number;
    ratings: any[];
  } | null>(null);

  useEffect(() => {
    const fetchRatings = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await activityService.getActivityRatings(activityId);
        setRatingsData(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || '無法載入評分');
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [activityId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!ratingsData || ratingsData.totalRatings === 0) {
    return (
      <Alert severity="info">
        此活動尚無評價
      </Alert>
    );
  }

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
  ratingsData.ratings.forEach((rating) => {
    if (rating.rating >= 1 && rating.rating <= 5) {
      ratingCounts[rating.rating - 1]++;
    }
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Star sx={{ color: 'warning.main' }} />
        活動評價
      </Typography>

      {/* Rating Distribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" gutterBottom>
                {ratingsData.averageRating.toFixed(1)}
              </Typography>
              <Rating value={ratingsData.averageRating} precision={0.1} readOnly size="large" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                基於 {ratingsData.totalRatings} 則評價
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingCounts[stars - 1];
                const percentage = ratingsData.totalRatings > 0
                  ? (count / ratingsData.totalRatings) * 100
                  : 0;

                return (
                  <Box key={stars} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 60 }}>
                      {stars} 星
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{ flex: 1, mx: 2, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'right' }}>
                      {count}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Individual Ratings */}
      <RatingsList
        ratings={ratingsData.ratings}
        averageRating={ratingsData.averageRating}
        totalRatings={ratingsData.totalRatings}
      />
    </Box>
  );
};
