import { useEffect } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { GPSPosition } from '../types/gps.types';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GPSTrackerProps {
  currentPosition: GPSPosition | null;
  positions: GPSPosition[];
  error: string | null;
}

// Component to update map center when position changes
function MapUpdater({ position }: { position: GPSPosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [position, map]);

  return null;
}

export const GPSTracker: React.FC<GPSTrackerProps> = ({
  currentPosition,
  positions,
  error,
}) => {
  const { t } = useTranslation();
  const defaultCenter: LatLngExpression = [25.0330, 121.5654]; // Taipei
  const center: LatLngExpression = currentPosition
    ? [currentPosition.latitude, currentPosition.longitude]
    : defaultCenter;

  const polylinePositions: LatLngExpression[] = positions.map((pos) => [
    pos.latitude,
    pos.longitude,
  ]);

  return (
    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {t('livePositionTracking')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapUpdater position={currentPosition} />

          {currentPosition && (
            <Marker position={[currentPosition.latitude, currentPosition.longitude]} />
          )}

          {polylinePositions.length > 1 && (
            <Polyline positions={polylinePositions} color="blue" weight={3} />
          )}
        </MapContainer>
      </Box>

      {currentPosition && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            緯度: {currentPosition.latitude.toFixed(6)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            經度: {currentPosition.longitude.toFixed(6)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            精確度: {currentPosition.accuracy.toFixed(2)} 公尺
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
