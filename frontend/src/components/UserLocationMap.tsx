import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({
  position,
}: {
  position: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.latitude, position.longitude], map.getZoom());
    }
  }, [position, map]);
  return null;
}

interface UserLocationMapProps {
  height?: number | string;
}

export const UserLocationMap = ({ height = 280 }: UserLocationMapProps) => {
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  const defaultCenter: [number, number] = [22.3193, 114.1694]; // Hong Kong
  const center: [number, number] = position
    ? [position.latitude, position.longitude]
    : defaultCenter;

  useEffect(() => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError('您的瀏覽器不支援定位功能');
      setLoading(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setError('請允許存取位置以顯示您的位置');
        } else if (err.code === 2) {
          setError('無法取得位置資訊');
        } else {
          setError('定位失敗，請稍後再試');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <Paper elevation={1} sx={{ overflow: 'hidden', mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'grey.50' }}>
        <LocationOn color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>
          我的即時位置
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mx: 1.5, mb: 1 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height, width: '100%', position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={position ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater position={position} />
          {position && <Marker position={[position.latitude, position.longitude]} />}
        </MapContainer>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.7)',
              zIndex: 1000,
            }}
          >
            <Typography color="text.secondary">取得位置中...</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};
