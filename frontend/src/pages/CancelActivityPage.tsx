import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Cancel } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { activityService } from '../services/activity.service';
import { Activity } from '../types/activity.types';

export const CancelActivityPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const loadActivity = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await activityService.getActivityById(id);
        setActivity(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || t('loadActivityFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [id]);

  const handleCancelActivity = async () => {
    if (!id) return;

    try {
      setCancelling(true);
      setError(null);
      await activityService.deleteActivity(id);
      navigate('/activities', { 
        state: { message: t('activityCancelledSuccess') } 
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || t('cancelActivityFailed'));
      setConfirmOpen(false);
    } finally {
      setCancelling(false);
    }
  };

  if (!loading && !activity) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{t('activityNotFound')}</Alert>
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
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/activities')} sx={{ mb: 3 }}>
          {t('backToList')}
        </Button>
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/activities/${id}`)}
        sx={{ mb: 3 }}
      >
        {t('backToActivityDetail')}
      </Button>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom color="error">
          {t('cancelActivityTitle')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>{t('warningIrreversible')}</strong>
          </Typography>
          <Typography variant="body2">
            {t('cancelWarningDesc')}
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('activityInfo')}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>{t('titleLabel')}：</strong>{activity.title}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>{t('timeLabel')}：</strong>{formatDate(activity.scheduledDate)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>{t('locationLabel')}：</strong>{activity.location.address}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>{t('participants')}：</strong>{activity.currentParticipants} / {activity.maxParticipants} {t('people')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={() => setConfirmOpen(true)}
            fullWidth
            disabled={cancelling}
          >
            {t('confirmCancelActivity')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`/activities/${id}`)}
            fullWidth
            disabled={cancelling}
          >
            {t('back')}
          </Button>
        </Box>
      </Paper>

      <Dialog
        open={confirmOpen}
        onClose={() => !cancelling && setConfirmOpen(false)}
      >
        <DialogTitle>{t('confirmCancelActivity')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('confirmCancelQuestion', { title: activity.title })}
            <br />
            <br />
            {t('confirmCancelDesc', { count: activity.currentParticipants })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={cancelling}
          >
            {t('back')}
          </Button>
          <Button
            onClick={handleCancelActivity}
            color="error"
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? <CircularProgress size={24} /> : t('confirmCancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
