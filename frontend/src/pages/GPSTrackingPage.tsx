import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGPSTracker } from '../hooks/useGPSTracker';
import { GPSTracker } from '../components/GPSTracker';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { RouteRecordingControls } from '../components/RouteRecordingControls';
import { useTranslation } from 'react-i18next';
import { activityService } from '../services/activity.service';
import { useAuth } from '../hooks/useAuth';
import type { Activity } from '../types/activity.types';

const COUNTDOWN_SECONDS = 5;

export const GPSTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'running'>('ready');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const {
    isTracking,
    isPaused,
    positions,
    currentPosition,
    metrics,
    error,
    startTracking,
    pauseTracking,
    stopTracking,
    clearPositions,
  } = useGPSTracker();

  useEffect(() => {
    if (!activityId) return;
    let cancelled = false;
    setLoading(true);
    activityService
      .getActivityById(activityId)
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch(() => {
        if (!cancelled) setActivity(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activityId]);

  const isHost = user?.id === activity?.creatorId;
  const isParticipant = activity?.participants?.some((p) => p.userId === user?.id) ?? false;

  const handleStartCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown <= 0) {
      setPhase('running');
      activityService.updateActivityStatus(activityId!, 'in-progress').catch(() => {});
      startTracking();
      return;
    }

    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, activityId, startTracking]);

  const handleStartTracking = useCallback(
    async (isResume?: boolean) => {
      if (isResume) {
        await startTracking(true);
      } else {
        handleStartCountdown();
      }
    },
    [startTracking, handleStartCountdown]
  );

  const handleStopTracking = useCallback(() => {
    stopTracking();
    if (isHost && activityId) {
      activityService.updateActivityStatus(activityId, 'completed').catch(() => {});
    }
  }, [stopTracking, isHost, activityId]);

  if (!activityId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" color="error">
          {t('activityIdInvalid')}
        </Typography>
      </Container>
    );
  }

  if (loading || !activity) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="body1">{t('loading')}</Typography>
      </Container>
    );
  }

  if (!isHost && !isParticipant) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">{t('notParticipantWarning')}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/activities/${activityId}`)} sx={{ mt: 2 }}>
          {t('backToActivity')}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/activities/${activityId}`)}
          variant="outlined"
        >
          {t('backToActivity')}
        </Button>
        <Typography variant="h4" component="h1">
          {activity.title} · {t('gpsTracking')}
        </Typography>
      </Box>

      {isHost && phase === 'countdown' && (
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            mb: 3,
          }}
        >
          <Typography variant="h2" fontWeight="bold">
            {countdown > 0 ? countdown : t('go')}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {countdown > 0 ? t('getReady') : t('startTracking')}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {isHost && (
          <Grid item xs={12}>
            <RouteRecordingControls
              activityId={activityId}
              isTracking={isTracking}
              isPaused={isPaused}
              positions={positions}
              metrics={metrics}
              onStartTracking={handleStartTracking}
              onPauseTracking={pauseTracking}
              onStopTracking={handleStopTracking}
              onClearPositions={clearPositions}
            />
          </Grid>
        )}

        {isHost && (
          <Grid item xs={12}>
            <PerformanceMetrics metrics={metrics} />
          </Grid>
        )}

        <Grid item xs={12}>
          <GPSTracker
            currentPosition={currentPosition}
            positions={positions}
            error={error}
          />
        </Grid>
      </Grid>

      {isParticipant && !isHost && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('monitoringInfo')}
          </Alert>
          {!isTracking && !isPaused && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => startTracking()}
              disabled={!!error}
            >
              {t('showMyLocation')}
            </Button>
          )}
        </Box>
      )}

      {isHost && phase === 'ready' && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('clickStartToCountdown')}
          </Typography>
        </Box>
      )}
    </Container>
  );
};
