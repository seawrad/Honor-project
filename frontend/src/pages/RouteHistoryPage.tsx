import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import SpeedIcon from '@mui/icons-material/Speed';
import TimelapseIcon from '@mui/icons-material/Timelapse';
import { gpsService } from '../services/gps.service';
import { RouteData } from '../types/gps.types';
import { useTranslation } from 'react-i18next';
import { RouteVisualization } from '../components/RouteVisualization';
import { RouteItemSkeleton } from '../components/skeletons';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';

export const RouteHistoryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await gpsService.getUserRoutes(user.id);
        setRoutes(data);
      } catch (err: any) {
        console.error('Failed to fetch routes:', err);
        setError(err.response?.data?.error?.message || t('loadRouteHistoryFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [user]);

  const handleRouteClick = (route: RouteData) => {
    setSelectedRoute(route);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRoute(null);
  };

  const locale = i18n.language === 'en' ? 'en-US' : 'zh-TW';
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} ${t('hours')} ${minutes} ${t('minutes')}`;
    }
    return `${minutes} ${t('minutes')}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          {t('back')}
        </Button>
        <Typography variant="h4" component="h1">
          {t('routeHistory')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && routes.length === 0 ? (
        <EmptyState
          variant="no-routes"
          title={t('noRouteRecords')}
          description={t('startTrackingToBuildHistory')}
        />
      ) : loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <RouteItemSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={3}>
          {routes.map((route) => (
            <Grid item xs={12} sm={6} md={4} key={route.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleRouteClick(route)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    {formatDate(route.startTime)}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <RouteIcon color="action" />
                    <Typography variant="body1">
                      <strong>{(Number(route.totalDistance) || 0).toFixed(2)}</strong> {t('kmShort')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SpeedIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('avgSpeed')}: {(Number(route.averageSpeed) || 0).toFixed(2)} {t('kmPerHour')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelapseIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {t('duration')}: {formatTime(Number(route.duration) || 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      {t('gpsPoints')}: {route.positions?.length ?? '—'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('routeDetails')}</Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRoute && <RouteVisualization route={selectedRoute} />}
        </DialogContent>
      </Dialog>
    </Container>
  );
};
