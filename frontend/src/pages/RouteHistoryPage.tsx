import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
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
import { RouteVisualization } from '../components/RouteVisualization';
import { useAuth } from '../hooks/useAuth';

export const RouteHistoryPage: React.FC = () => {
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
        setError(err.response?.data?.error?.message || '載入路線歷史失敗');
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

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString('zh-TW', {
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
      return `${hours} 小時 ${minutes} 分鐘`;
    }
    return `${minutes} 分鐘`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          variant="outlined"
        >
          返回
        </Button>
        <Typography variant="h4" component="h1">
          路線歷史
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {routes.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          <RouteIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            尚無路線記錄
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            開始追蹤您的跑步活動以建立路線歷史
          </Typography>
        </Box>
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
                      <strong>{(Number(route.totalDistance) || 0).toFixed(2)}</strong> 公里
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SpeedIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      平均速度: {(Number(route.averageSpeed) || 0).toFixed(2)} 公里/小時
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelapseIcon color="action" />
                    <Typography variant="body2" color="text.secondary">
                      持續時間: {formatTime(Number(route.duration) || 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      GPS 位置點: {route.positions?.length ?? '—'}
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
            <Typography variant="h6">路線詳情</Typography>
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
