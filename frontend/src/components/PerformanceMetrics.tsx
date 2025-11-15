import { Box, Paper, Typography, Grid } from '@mui/material';
import { PerformanceMetrics as MetricsType } from '../types/gps.types';
import SpeedIcon from '@mui/icons-material/Speed';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import RouteIcon from '@mui/icons-material/Route';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface PerformanceMetricsProps {
  metrics: MetricsType;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (speed: number): string => {
    return speed.toFixed(2);
  };

  const formatDistance = (distance: number): string => {
    return distance.toFixed(2);
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        效能指標
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              bgcolor: 'primary.light',
              borderRadius: 2,
              color: 'white',
            }}
          >
            <RouteIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {formatDistance(metrics.distance)}
            </Typography>
            <Typography variant="body2">公里</Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              bgcolor: 'secondary.light',
              borderRadius: 2,
              color: 'white',
            }}
          >
            <SpeedIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {formatSpeed(metrics.currentSpeed)}
            </Typography>
            <Typography variant="body2">公里/小時</Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              bgcolor: 'success.light',
              borderRadius: 2,
              color: 'white',
            }}
          >
            <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {formatSpeed(metrics.averageSpeed)}
            </Typography>
            <Typography variant="body2">平均速度</Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              bgcolor: 'info.light',
              borderRadius: 2,
              color: 'white',
            }}
          >
            <TimelapseIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold">
              {formatTime(metrics.elapsedTime)}
            </Typography>
            <Typography variant="body2">經過時間</Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
