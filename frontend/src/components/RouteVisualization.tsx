import { Box, Paper, Typography, Grid } from '@mui/material';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RouteData } from '../types/gps.types';
import L from 'leaflet';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for start and end markers
const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RouteVisualizationProps {
  route: RouteData;
}

export const RouteVisualization: React.FC<RouteVisualizationProps> = ({ route }) => {
  const positions: LatLngExpression[] = route.positions.map((pos) => [
    pos.latitude,
    pos.longitude,
  ]);

  const center: LatLngExpression =
    positions.length > 0 ? positions[Math.floor(positions.length / 2)] : [25.0330, 121.5654];

  const startPosition = positions[0];
  const endPosition = positions[positions.length - 1];

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        路線視覺化
      </Typography>

      <Box sx={{ height: 400, width: '100%', mb: 3 }}>
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {positions.length > 1 && (
            <Polyline positions={positions} color="blue" weight={4} opacity={0.7} />
          )}

          {startPosition && <Marker position={startPosition} icon={startIcon} />}
          {endPosition && <Marker position={endPosition} icon={endIcon} />}
        </MapContainer>
      </Box>

      <Typography variant="h6" gutterBottom>
        路線統計
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {route.totalDistance.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              總距離 (公里)
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="secondary" fontWeight="bold">
              {route.averageSpeed.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              平均速度 (公里/小時)
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {formatTime(route.duration)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              持續時間
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="info.main" fontWeight="bold">
              {route.positions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              GPS 位置點
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              開始時間
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(route.startTime)}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              結束時間
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(route.endTime)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
