import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, Button, CircularProgress } from '@mui/material';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import StyleIcon from '@mui/icons-material/Style';
import { RouteData } from '../types/gps.types';
import { memoryCardService } from '../services/memoryCard.service';
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
  const navigate = useNavigate();
  const [memoryCards, setMemoryCards] = useState<{ id: string; runDate: string }[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  useEffect(() => {
    if (!route.activityId) return;
    let cancelled = false;
    setCardsLoading(true);
    memoryCardService
      .getByActivityId(route.activityId)
      .then((cards) => {
        if (!cancelled) {
          setMemoryCards(cards.map((c) => ({ id: c.id, runDate: c.runDate })));
        }
      })
      .catch(() => {
        if (!cancelled) setMemoryCards([]);
      })
      .finally(() => {
        if (!cancelled) setCardsLoading(false);
      });
    return () => { cancelled = true; };
  }, [route.activityId]);

  const positions: LatLngExpression[] = (route.positions ?? []).map((pos) => [
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
        {positions.length === 0 && (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 1,
            }}
          >
            <Typography color="text.secondary">
              無路線軌跡資料可顯示
            </Typography>
          </Box>
        )}
        {positions.length > 0 && (
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
        )}
      </Box>

      <Typography variant="h6" gutterBottom>
        路線統計
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {(Number(route.totalDistance) || 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              總距離 (公里)
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="secondary" fontWeight="bold">
              {(Number(route.averageSpeed) || 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              平均速度 (公里/小時)
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {formatTime(Number(route.duration) || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              持續時間
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h5" color="info.main" fontWeight="bold">
              {route.positions?.length ?? '—'}
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

      {route.activityId && (
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            跑步記憶卡
          </Typography>
          {cardsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">載入中...</Typography>
            </Box>
          ) : memoryCards.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {memoryCards.map((card) => (
                <Button
                  key={card.id}
                  variant="outlined"
                  size="small"
                  startIcon={<StyleIcon />}
                  onClick={() => navigate(`/memory-cards/${card.id}`)}
                >
                  查看 {new Date(card.runDate).toLocaleDateString('zh-TW')} 記憶卡
                </Button>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              此路線尚無跑步記憶卡
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};
