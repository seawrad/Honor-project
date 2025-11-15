import { Container, Typography, Box, Button, Grid } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGPSTracker } from '../hooks/useGPSTracker';
import { GPSTracker } from '../components/GPSTracker';
import { PerformanceMetrics } from '../components/PerformanceMetrics';
import { RouteRecordingControls } from '../components/RouteRecordingControls';

export const GPSTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const { activityId } = useParams<{ activityId: string }>();
  
  const {
    isTracking,
    positions,
    currentPosition,
    metrics,
    error,
    startTracking,
    stopTracking,
    clearPositions,
  } = useGPSTracker();

  if (!activityId) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" color="error">
          活動 ID 不存在
        </Typography>
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
          返回活動
        </Button>
        <Typography variant="h4" component="h1">
          GPS 追蹤
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <RouteRecordingControls
            activityId={activityId}
            isTracking={isTracking}
            positions={positions}
            metrics={metrics}
            onStartTracking={startTracking}
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
    </Container>
  );
};
