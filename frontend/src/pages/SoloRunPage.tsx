import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import { useGPSTracker } from '../hooks/useGPSTracker';
import { GPSTracker } from '../components/GPSTracker';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { SoloRunControls } from '../components/SoloRunControls';

type Phase = 'countdown' | 'ready' | 'running';

const COUNTDOWN_SECONDS = 5;

export const SoloRunPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('ready');
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

  const handleStartCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  const handleStartTracking = useCallback(
    async (isResume?: boolean) => {
      if (isResume) {
        await startTracking(true);
      } else {
        if (positions.length > 0 && !window.confirm(t('confirmNewRun'))) {
          return;
        }
        if (positions.length > 0) clearPositions();
        handleStartCountdown();
      }
    },
    [startTracking, handleStartCountdown, positions.length, clearPositions]
  );

  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown <= 0) {
      setPhase('running');
      startTracking();
      return;
    }

    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, startTracking]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          {t('backToHome')}
        </Button>
        <Typography variant="h4" component="h1">
          {t('soloRun')}
        </Typography>
      </Box>

      {phase === 'countdown' && (
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
        <Grid item xs={12}>
          <SoloRunControls
            isTracking={isTracking}
            isPaused={isPaused}
            positions={positions}
            metrics={metrics}
            isCountdown={phase === 'countdown'}
            onStartTracking={handleStartTracking}
            onPauseTracking={pauseTracking}
            onStopTracking={stopTracking}
            onClearPositions={clearPositions}
          />
        </Grid>

        <Grid item xs={12}>
          <PerformanceMetrics metrics={metrics} />
        </Grid>

        <Grid item xs={12}>
          <GPSTracker
            currentPosition={currentPosition}
            positions={positions}
            error={error}
          />
        </Grid>
      </Grid>

      {phase === 'ready' && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t('clickStartToCountdown')}
          </Typography>
        </Box>
      )}
    </Container>
  );
};
