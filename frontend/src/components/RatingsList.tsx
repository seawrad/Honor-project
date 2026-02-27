import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Rating,
  Avatar,
  Divider,
} from '@mui/material';
import { ActivityRating } from '../types/activity.types';

interface RatingsListProps {
  ratings: ActivityRating[];
  averageRating: number;
  totalRatings: number;
}

export const RatingsList: React.FC<RatingsListProps> = ({
  ratings,
  averageRating,
  totalRatings,
}) => {
  const { t, i18n } = useTranslation();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box>
      {/* Rating Summary */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
        </Typography>
        <Rating value={averageRating} precision={0.1} readOnly size="large" />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('basedOnRatings', { count: totalRatings })}
        </Typography>
      </Paper>

      {/* Individual Ratings */}
      {ratings.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('noRatingsYet')}
        </Typography>
      ) : (
        <Box>
          {ratings.map((rating, index) => (
            <Box key={rating.id}>
              <Box sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {rating.userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1">{rating.userName}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={rating.rating} readOnly size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(rating.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                {rating.feedback && (
                  <Typography variant="body2" sx={{ ml: 7 }}>
                    {rating.feedback}
                  </Typography>
                )}
              </Box>
              {index < ratings.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
