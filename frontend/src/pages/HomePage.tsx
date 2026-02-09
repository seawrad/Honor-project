import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Grid,
} from '@mui/material';
import { CalendarToday, DirectionsRun } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/user.service';
import { WeatherModule } from '../components/WeatherModule';
import { UserStatsSummary } from '../components/UserStatsSummary';
import type { RecentActivity, UserStatsSummary as UserStatsSummaryType } from '../types/user.types';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [upcomingActivities, setUpcomingActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [stats, setStats] = useState<UserStatsSummaryType | null>(null);

  useEffect(() => {
    const loadUpcoming = async () => {
      if (!user?.id) return;
      try {
        setLoadingActivities(true);
        const profile = await userService.getUserProfile(user.id);
        const upcoming = profile.recentActivities
          .filter((a) => a.status === 'upcoming')
          .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
        setUpcomingActivities(upcoming);
      } catch {
        setUpcomingActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };
    loadUpcoming();
  }, [user?.id]);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const data = await userService.getUserStatsSummary(user.id);
        setStats(data);
      } catch {
        setStats(null);
      }
    };
    loadStats();
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: { xs: 2, sm: 4, md: 8 } }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="h3" gutterBottom>
                歡迎來到 RunCrew
              </Typography>
              
              <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
                您好，{user?.displayName}！
              </Typography>

              <Typography variant="body1" paragraph>
                電子郵件：{user?.email}
              </Typography>

              <Typography variant="body1" paragraph>
                年齡：{user?.age}
              </Typography>

              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                sx={{ mt: 4 }}
              >
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={() => navigate('/activities')}
            >
              探索活動
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={() => navigate('/activities/create')}
            >
              建立活動
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={handleLogout}
            >
              登出
            </Button>
          </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', md: 'flex-end' }, gap: 2 }}>
              <WeatherModule />
              <UserStatsSummary stats={stats} />
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            即將參加的活動
          </Typography>
          {loadingActivities ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : upcomingActivities.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              尚無即將參加的活動，快去探索活動吧！
            </Typography>
          ) : (
            <List disablePadding>
              {upcomingActivities.map((activity) => (
                <ListItem key={activity.id} disablePadding divider>
                  <ListItemButton onClick={() => navigate(`/activities/${activity.id}`)}>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 14 }} />
                            {formatDate(activity.scheduledDate)}
                          </Box>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DirectionsRun sx={{ fontSize: 14 }} />
                            {activity.distance} 公里
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
