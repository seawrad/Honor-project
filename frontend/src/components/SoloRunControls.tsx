import { useState } from 'react';
import { useToast } from './ErrorToast';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useTranslation } from 'react-i18next';
import { GPSPosition, PerformanceMetrics } from '../types/gps.types';
import { gpsService } from '../services/gps.service';
import { memoryCardService } from '../services/memoryCard.service';
import { weatherService } from '../services/weather.service';

interface SoloRunControlsProps {
  isTracking: boolean;
  isPaused: boolean;
  isCountdown?: boolean;
  positions: GPSPosition[];
  metrics: PerformanceMetrics;
  onStartTracking: (isResume?: boolean) => void | Promise<void>;
  onPauseTracking: () => void;
  onStopTracking: () => void;
  onClearPositions: () => void;
}

export const SoloRunControls: React.FC<SoloRunControlsProps> = ({
  isTracking,
  isPaused,
  isCountdown = false,
  positions,
  metrics,
  onStartTracking,
  onPauseTracking,
  onStopTracking,
  onClearPositions,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedRouteData, setSavedRouteData] = useState<{
    routeId?: string;
    totalDistance: number;
    averageSpeed: number;
    duration: number;
    runDate: string;
    pointCount: number;
  } | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const { showToast } = useToast();

  const handleEndRun = () => {
    onStopTracking();
  };

  const handleSave = async () => {
    if (positions.length < 2) {
      setSaveError(t('minTwoPointsRequired'));
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const startTime = positions[0].timestamp;
      const routeData = {
        activityId: null,
        positions,
        totalDistance: metrics.distance,
        averageSpeed: metrics.averageSpeed,
        duration: metrics.elapsedTime,
        startTime,
        endTime: positions[positions.length - 1].timestamp,
      };

      const savedRoute = await gpsService.createRoute(routeData);
      setSavedRouteData({
        routeId: savedRoute.id,
        totalDistance: metrics.distance,
        averageSpeed: metrics.averageSpeed,
        duration: metrics.elapsedTime,
        runDate: new Date(startTime).toISOString().slice(0, 10),
        pointCount: positions.length,
      });
      setShowSuccessDialog(true);
      onClearPositions();
    } catch (error: any) {
      console.error('Failed to save route:', error);
      setSaveError(error.response?.data?.error?.message || t('saveRouteFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setSavedRouteData(null);
    navigate('/');
  };

  const handleCreateMemoryCard = async () => {
    if (!savedRouteData) return;
    setIsCreatingCard(true);
    try {
      const weather = await weatherService.getCurrentWeather();
      const card = await memoryCardService.create({
        activityId: null,
        routeId: savedRouteData.routeId,
        runDate: savedRouteData.runDate,
        participantCount: 1,
        totalDistance: savedRouteData.totalDistance,
        averageSpeed: savedRouteData.averageSpeed,
        durationSeconds: savedRouteData.duration,
        weatherTemp: weather?.temperature,
        weatherDesc: weather?.weatherDesc,
        routeSummary: { pointCount: savedRouteData.pointCount },
      });
      const newlyUnlocked = (card as any).newlyUnlockedAchievements as string[] | undefined;
      if (newlyUnlocked?.length) {
        showToast(t('newAchievementsUnlocked', { count: newlyUnlocked.length }), 'success');
      }
      handleCloseSuccessDialog();
      navigate(`/memory-cards/${card.id}`);
    } catch (err) {
      console.error('Create memory card failed:', err);
    } finally {
      setIsCreatingCard(false);
    }
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('soloRunControls')}
        </Typography>

        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {!isTracking && !isPaused ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={isCountdown ? undefined : <PlayArrowIcon />}
              onClick={() => !isCountdown && onStartTracking()}
              disabled={isCountdown}
              size="large"
            >
              {isCountdown ? t('preparing') : t('startTrackingBtn')}
            </Button>
          ) : isTracking ? (
            <>
              <Button
                variant="contained"
                color="warning"
                startIcon={<PauseIcon />}
                onClick={onPauseTracking}
                size="large"
              >
                {t('pause')}
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleEndRun}
                size="large"
              >
                {t('endRun')}
              </Button>
            </>
          ) : isPaused ? (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={() => onStartTracking(true)}
                size="large"
              >
                {t('resume')}
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleEndRun}
                size="large"
              >
                {t('endRun')}
              </Button>
            </>
          ) : null}

          <Button
            variant="contained"
            color="success"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
            onClick={handleSave}
            disabled={isTracking || isPaused || positions.length < 2 || isSaving}
            size="large"
          >
            {isSaving ? t('saving') : t('saveRoute')}
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('recordedPoints')}: {positions.length}
          </Typography>
          {!isTracking && !isPaused && positions.length > 0 && (
            <Typography variant="body2" color="success.main">
              {t('runEndedCanSave')}
            </Typography>
          )}
          {isPaused && (
            <Typography variant="body2" color="warning.main">
              {t('paused')}
            </Typography>
          )}
          {isTracking && (
            <Typography variant="body2" color="primary.main">
              {t('trackingInProgress')}
            </Typography>
          )}
        </Box>
      </Paper>

      <Dialog open={showSuccessDialog} onClose={handleCloseSuccessDialog}>
        <DialogTitle>{t('routeSavedSuccess')}</DialogTitle>
        <DialogContent>
          <Typography>{t('soloRouteSaved')}</Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {t('createMemoryCardHint')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            startIcon={isCreatingCard ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
            onClick={handleCreateMemoryCard}
            disabled={isCreatingCard}
          >
            {isCreatingCard ? t('creating') : t('createMemoryCard')}
          </Button>
          <Button onClick={handleCloseSuccessDialog} color="primary">
            {t('later')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
