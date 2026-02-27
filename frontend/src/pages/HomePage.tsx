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
  Grid,
} from '@mui/material';
import { CalendarToday, DirectionsRun, EmojiEvents } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/user.service';
import { WeatherModule } from '../components/WeatherModule';
import { UserStatsSummary } from '../components/UserStatsSummary';
import type { RecentActivity, UserStatsSummary as UserStatsSummaryType } from '../types/user.types';

export const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [upcomingActivities, setUpcomingActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [stats, setStats] = useState<UserStatsSummaryType | null>(null);
  const [achievementCount, setAchievementCount] = useState<number | null>(null);

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

  // Check for new achievements and load count on home load
  useEffect(() => {
    if (!user?.id) return;
    import('../services/achievement.service').then(({ achievementService }) => {
      achievementService.checkAchievements().catch(() => {});
      achievementService.getUnlockedCount().then(setAchievementCount).catch(() => setAchievementCount(0));
    });
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const locale = i18n.language === 'en' ? 'en-US' : 'zh-TW';
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
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
                {t('welcomeToRunCrew')}
              </Typography>
              
              <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
                {t('hello')}，{user?.displayName}！
              </Typography>

              <Typography variant="body1" paragraph>
                {t('emailLabel')}：{user?.email}
              </Typography>

              <Typography variant="body1" paragraph>
                {t('ageLabel')}：{user?.age}
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
              {t('exploreActivities')}
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              startIcon={<DirectionsRun />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={() => navigate('/run-now')}
            >
              {t('runNow')}
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={() => navigate('/activities/create')}
            >
              {t('createActivity')}
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={handleLogout}
            >
              {t('logout')}
            </Button>
          </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', md: 'flex-end' }, gap: 2 }}>
              <WeatherModule />
              <UserStatsSummary stats={stats} />
              {achievementCount !== null && (
                <Button
                  variant="outlined"
                  startIcon={<EmojiEvents />}
                  onClick={() => navigate('/achievements')}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    borderColor: 'warning.main',
                    color: 'warning.dark',
                    '&:hover': { borderColor: 'warning.dark', bgcolor: 'rgba(255, 193, 7, 0.08)' },
                  }}
                >
                  {t('achievementsUnlocked', { count: achievementCount })}
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            {t('upcomingActivities')}
          </Typography>
          {!loadingActivities && upcomingActivities.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              {t('noUpcomingActivities')}
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
                            {activity.distance} {t('kmShort')}
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
