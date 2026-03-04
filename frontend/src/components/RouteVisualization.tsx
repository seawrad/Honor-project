import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Grid, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import StyleIcon from '@mui/icons-material/Style';
import ShareIcon from '@mui/icons-material/Share';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useTranslation } from 'react-i18next';
import { useToast } from './ErrorToast';
import { RouteData } from '../types/gps.types';
import { memoryCardService } from '../services/memoryCard.service';
import { weatherService } from '../services/weather.service';
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [memoryCards, setMemoryCards] = useState<{ id: string; runDate: string }[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);

  const formatTimeForShare = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  const handleShare = async () => {
    const dist = (Number(route.totalDistance) || 0).toFixed(1);
    const speed = (Number(route.averageSpeed) || 0).toFixed(1);
    const dur = formatTimeForShare(Number(route.duration) || 0);
    const dateStr = new Date(route.startTime).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const text = `${t('runCrewMemoryCard')}: ${dist} ${t('kmShort')} · ${dur} · ${speed} ${t('kmPerHour')} · ${dateStr}`;
    const url = memoryCards.length > 0
      ? `${window.location.origin}/memory-cards/${memoryCards[0].id}`
      : `${window.location.origin}/routes/history`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t('runCrewMemoryCard'), text, url });
        showToast(t('shareSuccess') || 'Shared!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard?.writeText(`${text}\n${url}`);
          showToast(t('copiedToClipboard') || 'Copied to clipboard', 'success');
        }
      }
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`);
      showToast(t('copiedToClipboard') || 'Copied to clipboard', 'success');
    }
  };

  const handleCreateMemoryCard = async () => {
    setIsCreatingCard(true);
    try {
      const weather = await weatherService.getCurrentWeather();
      const runDate = route.startTime
        ? new Date(route.startTime).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const card = await memoryCardService.create({
        activityId: route.activityId ?? null,
        routeId: route.id,
        runDate,
        participantCount: 1,
        totalDistance: route.totalDistance ?? 0,
        averageSpeed: route.averageSpeed ?? 0,
        durationSeconds: route.duration ?? 0,
        weatherTemp: weather?.temperature,
        weatherDesc: weather?.weatherDesc,
        routeSummary: route.positions ? { pointCount: route.positions.length } : undefined,
      });
      setMemoryCards((prev) => [...prev, { id: card.id, runDate: card.runDate }]);
      const newlyUnlocked = (card as any).newlyUnlockedAchievements as string[] | undefined;
      if (newlyUnlocked?.length) {
        showToast(`🎉 ${t('newAchievementsUnlocked', { count: newlyUnlocked.length })}`, 'success');
      }
      navigate(`/memory-cards/${card.id}`);
    } catch (err: any) {
      console.error('Create memory card failed:', err);
      showToast(err.response?.data?.error?.message || t('loadMemoryCardFailed'), 'error');
    } finally {
      setIsCreatingCard(false);
    }
  };

  useEffect(() => {
    if (!route.activityId && !route.id) return;
    let cancelled = false;
    setCardsLoading(true);
    const fetchCards = route.activityId
      ? memoryCardService.getByActivityId(route.activityId)
      : memoryCardService.getByRouteId(route.id);
    fetchCards
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
  }, [route.activityId, route.id]);

  const positions: LatLngExpression[] = (route.positions ?? []).map((pos) => [
    pos.latitude,
    pos.longitude,
  ]);

  const center: LatLngExpression =
    positions.length > 0 ? positions[Math.floor(positions.length / 2)] : [22.3193, 114.1694]; // Hong Kong

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
    return new Date(date).toLocaleString(i18n.language === 'en' ? 'en-US' : 'zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {t('routeVisualization')}
        </Typography>
        <Tooltip title={t('share')}>
          <IconButton aria-label={t('share')} onClick={handleShare} color="primary" size="small">
            <ShareIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ height: { xs: 'min(400px, 45vh)', sm: 400 }, minHeight: 280, width: '100%', mb: 3 }}>
        {positions.length === 0 && (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Typography color="text.secondary">
              {t('noRouteData')}
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
        {t('routeStats')}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h5" color="primary" fontWeight="bold">
              {(Number(route.totalDistance) || 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('totalDistanceKm')}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h5" color="secondary" fontWeight="bold">
              {(Number(route.averageSpeed) || 0).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('avgSpeedKmh')}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h5" color="success.main" fontWeight="bold">
              {formatTime(Number(route.duration) || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('duration')}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h5" color="info.main" fontWeight="bold">
              {route.positions?.length ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('gpsPoints')}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('startTime')}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(route.startTime)}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('endTime')}
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatDate(route.endTime)}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {(route.activityId || route.id) && (
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {t('runMemoryCard')}
          </Typography>
          {cardsLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">{t('loading')}</Typography>
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
                  {t('viewMemoryCard', { date: new Date(card.runDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-TW') })}
                </Button>
              ))}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start' }}>
              <Typography variant="body2" color="text.secondary">
                {t('noMemoryCardsForRoute')}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={isCreatingCard ? <CircularProgress size={16} color="inherit" /> : <PhotoCameraIcon />}
                onClick={handleCreateMemoryCard}
                disabled={isCreatingCard}
              >
                {isCreatingCard ? t('creating') : t('createMemoryCard')}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};
