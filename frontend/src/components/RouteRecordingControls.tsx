import { useState } from 'react';
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
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { GPSPosition, PerformanceMetrics } from '../types/gps.types';
import { gpsService } from '../services/gps.service';
import { memoryCardService } from '../services/memoryCard.service';
import { weatherService } from '../services/weather.service';

interface RouteRecordingControlsProps {
  activityId: string;
  isTracking: boolean;
  positions: GPSPosition[];
  metrics: PerformanceMetrics;
  onStartTracking: () => Promise<void>;
  onStopTracking: () => void;
  onClearPositions: () => void;
}

export const RouteRecordingControls: React.FC<RouteRecordingControlsProps> = ({
  activityId,
  isTracking,
  positions,
  metrics,
  onStartTracking,
  onStopTracking,
  onClearPositions,
}) => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);
  const [savedRouteData, setSavedRouteData] = useState<{
    activityId: string;
    routeId?: string;
    totalDistance: number;
    averageSpeed: number;
    duration: number;
    runDate: string;
    pointCount: number;
  } | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const handleStart = async () => {
    setSaveError(null);
    await onStartTracking();
  };

  const handleStop = () => {
    onStopTracking();
  };

  const handleSave = async () => {
    if (positions.length < 2) {
      setSaveError('需要至少 2 個 GPS 位置點才能儲存路線');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const startTime = positions[0].timestamp;
      const endTime = positions[positions.length - 1].timestamp;

      const routeData = {
        activityId,
        positions,
        totalDistance: metrics.distance,
        averageSpeed: metrics.averageSpeed,
        duration: metrics.elapsedTime,
        startTime,
        endTime,
      };

      const savedRoute = await gpsService.createRoute(routeData);
      setSavedRouteId(savedRoute.id);
      setSavedRouteData({
        activityId,
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
      setSaveError(error.response?.data?.error?.message || '儲存路線失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setSavedRouteId(null);
    setSavedRouteData(null);
  };

  const handleCreateMemoryCard = async () => {
    if (!savedRouteData) return;
    setIsCreatingCard(true);
    try {
      const weather = await weatherService.getCurrentWeather();
      const card = await memoryCardService.create({
        activityId: savedRouteData.activityId,
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
          路線記錄控制
        </Typography>

        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {!isTracking ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStart}
              size="large"
            >
              開始追蹤
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStop}
              size="large"
            >
              停止追蹤
            </Button>
          )}

          <Button
            variant="contained"
            color="success"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isTracking || positions.length < 2 || isSaving}
            size="large"
          >
            {isSaving ? '儲存中...' : '儲存路線'}
          </Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            記錄的位置點數: {positions.length}
          </Typography>
          {!isTracking && positions.length > 0 && (
            <Typography variant="body2" color="success.main">
              追蹤已停止，可以儲存路線
            </Typography>
          )}
          {isTracking && (
            <Typography variant="body2" color="primary.main">
              正在追蹤中...
            </Typography>
          )}
        </Box>
      </Paper>

      <Dialog open={showSuccessDialog} onClose={handleCloseSuccessDialog}>
        <DialogTitle>路線儲存成功</DialogTitle>
        <DialogContent>
          <Typography>
            您的路線已成功儲存！
          </Typography>
          {savedRouteId && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              路線 ID: {savedRouteId}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mt: 2 }}>
            建立跑步記憶卡，捕捉跑步瞬間！
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            startIcon={isCreatingCard ? <CircularProgress size={20} color="inherit" /> : <PhotoCameraIcon />}
            onClick={handleCreateMemoryCard}
            disabled={isCreatingCard}
          >
            {isCreatingCard ? '建立中...' : '建立跑步記憶卡'}
          </Button>
          <Button onClick={handleCloseSuccessDialog} color="primary">
            稍後
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
