import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGPSTracker, type PersistedTrackingSession } from '../hooks/useGPSTracker';
import { GPSTracker, ParticipantLocation } from '../components/GPSTracker';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { RouteRecordingControls } from '../components/RouteRecordingControls';
import { useTranslation } from 'react-i18next';
import { activityService } from '../services/activity.service';
import { useAuth } from '../hooks/useAuth';
import { socketService } from '../services/socket.service';
import type { Activity } from '../types/activity.types';

const LOCATION_EMIT_INTERVAL_MS = 4000;
const PERSIST_INTERVAL_MS = 10_000;
const STORAGE_KEY_PREFIX = 'gps-tracking-';

const COUNTDOWN_SECONDS = 5;
const DEV_COUNTDOWN_SECONDS = 0; // Skip countdown in dev mode

export const GPSTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  const { user, isDeveloperMode } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'running'>('ready');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [participantLocations, setParticipantLocations] = useState<ParticipantLocation[]>([]);

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
    restoreSession,
    getSessionForPersistence,
  } = useGPSTracker();

  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<PersistedTrackingSession | null>(null);

  const cancelledRef = useRef(false);

  const clearPersistedData = useCallback((id: string) => {
    try {
      sessionStorage.removeItem(STORAGE_KEY_PREFIX + id);
    } catch {
      // ignore
    }
  }, []);

  const handleClearPositions = useCallback(() => {
    if (activityId) clearPersistedData(activityId);
    clearPositions();
  }, [activityId, clearPersistedData, clearPositions]);

  // Persist tracking data periodically so it survives refresh
  useEffect(() => {
    if (!activityId || (!isTracking && !isPaused) || positions.length < 2) return;
    const persist = () => {
      const session = getSessionForPersistence();
      if (session) {
        try {
          sessionStorage.setItem(STORAGE_KEY_PREFIX + activityId, JSON.stringify(session));
        } catch {
          // ignore quota errors
        }
      }
    };
    persist();
    const interval = setInterval(persist, PERSIST_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activityId, isTracking, isPaused, positions.length, getSessionForPersistence]);

  // Check for persisted data on mount and show restore dialog (only when no current data)
  const hasCheckedRestore = useRef(false);
  useEffect(() => {
    if (!activityId || loading || !activity || hasCheckedRestore.current) return;
    hasCheckedRestore.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_PREFIX + activityId);
      if (raw) {
        const data = JSON.parse(raw) as PersistedTrackingSession;
        if (data?.positions?.length >= 2) {
          setPendingRestoreData(data);
          setShowRestoreDialog(true);
        }
      }
    } catch {
      clearPersistedData(activityId);
    }
  }, [activityId, loading, activity, clearPersistedData]);

  // Warn before refresh/close when tracking
  useEffect(() => {
    if (!isTracking && !isPaused) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isTracking, isPaused]);

  const handleRestoreSession = useCallback(() => {
    if (pendingRestoreData) {
      restoreSession(pendingRestoreData);
      setPhase('running');
    }
    setShowRestoreDialog(false);
    setPendingRestoreData(null);
  }, [pendingRestoreData, restoreSession]);

  const handleDiscardRestore = useCallback(() => {
    if (activityId) clearPersistedData(activityId);
    setShowRestoreDialog(false);
    setPendingRestoreData(null);
  }, [activityId, clearPersistedData]);

  useEffect(() => {
    if (!activityId) return;
    cancelledRef.current = false;
    setLoading(true);
    activityService
      .getActivityById(activityId)
      .then((data) => {
        if (!cancelledRef.current) setActivity(data);
      })
      .catch(() => {
        if (!cancelledRef.current) setActivity(null);
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });
    return () => {
      cancelledRef.current = true;
    };
  }, [activityId]);

  // Join activity tracking room for participant location sharing
  useEffect(() => {
    if (!activityId || !user) return;
    let cancelled = false;
    const setup = async () => {
      try {
        await socketService.connectAndWait();
        if (cancelled) return;
        socketService.joinActivityTracking(activityId);
      } catch {
        // Socket not connected (e.g. no token)
      }
    };
    setup();
    const handleLocation = (data: ParticipantLocation) => {
      if (cancelled) return;
      const withTimestamp = { ...data, lastUpdate: Date.now() };
      setParticipantLocations((prev) => {
        const filtered = prev.filter((p) => p.userId !== data.userId);
        return [...filtered, withTimestamp];
      });
    };
    socketService.onLocationReceived(handleLocation);
    const STALE_MS = 30_000;
    const staleInterval = setInterval(() => {
      if (cancelled) return;
      setParticipantLocations((prev) =>
        prev.filter((p) => (p.lastUpdate ?? 0) > Date.now() - STALE_MS)
      );
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(staleInterval);
      socketService.off('location_received', handleLocation);
      socketService.leaveActivityTracking(activityId);
    };
  }, [activityId, user]);

  // Emit location updates when tracking (include speed for pace display)
  useEffect(() => {
    if (!activityId || !isTracking || !currentPosition) return;
    const emit = () => {
      socketService.emitLocationUpdate(activityId, currentPosition.latitude, currentPosition.longitude, metrics.currentSpeed);
    };
    emit();
    const interval = setInterval(emit, LOCATION_EMIT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [activityId, isTracking, currentPosition?.latitude, currentPosition?.longitude, metrics.currentSpeed]);

  const isHost = user?.id === activity?.creatorId;
  const isParticipant = activity?.participants?.some((p) => p.userId === user?.id) ?? false;

  const countdownSeconds = isDeveloperMode ? DEV_COUNTDOWN_SECONDS : COUNTDOWN_SECONDS;

  const handleStartCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(countdownSeconds);
  }, [countdownSeconds]);

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
      <Dialog open={showRestoreDialog} onClose={handleDiscardRestore}>
        <DialogTitle>{t('restoreTrackingTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('restoreTrackingMessage')}</Typography>
          {pendingRestoreData && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('restoreTrackingDetails', {
                points: pendingRestoreData.positions.length,
                distance: pendingRestoreData.distance.toFixed(2),
                duration: Math.floor(pendingRestoreData.elapsedTime / 60),
              })}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDiscardRestore} color="inherit">
            {t('discard')}
          </Button>
          <Button onClick={handleRestoreSession} variant="contained" color="primary">
            {t('restore')}
          </Button>
        </DialogActions>
      </Dialog>

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
              onClearPositions={handleClearPositions}
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
            participantLocations={participantLocations}
            isHost={isHost}
            currentUserId={user?.id}
            currentUserAvatarUrl={user?.avatarUrl}
            currentUserDisplayName={user?.displayName}
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
