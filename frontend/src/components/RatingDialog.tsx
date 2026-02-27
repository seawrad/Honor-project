import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useTranslation } from 'react-i18next';

interface RatingDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback?: string) => Promise<void>;
  activityTitle: string;
}

export const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onClose,
  onSubmit,
  activityTitle,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === null || rating === 0) {
      setError(t('selectRating'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(rating, feedback.trim() || undefined);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('submitRatingFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(null);
    setFeedback('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('rateActivityTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {activityTitle}
          </Typography>

          <Box sx={{ mt: 3, mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="legend" sx={{ mb: 1 }}>
              {t('yourRating')}
            </Typography>
            <Rating
              name="activity-rating"
              value={rating}
              onChange={(_, newValue) => setRating(newValue ? Number(newValue) : null)}
              size="large"
              emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
            />
          </Box>

          <TextField
            label={t('feedbackOptional')}
            multiline
            rows={4}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={t('shareExperience')}
            inputProps={{ maxLength: 500 }}
            helperText={`${feedback.length}/500`}
            sx={{ mt: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || rating === null || rating === 0}
        >
          {isSubmitting ? t('submitting') : t('submitRating')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
