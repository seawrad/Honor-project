import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  DirectionsRun,
  Timeline,
  Star,
  People,
  CalendarToday,
} from '@mui/icons-material';
import { userService } from '../services/user.service';
import { UserProfile } from '../types/user.types';
import { FollowButton } from '../components/FollowButton';
import { useAuth } from '../hooks/useAuth';
import { ActivityCard } from '../components/ActivityCard';

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await userService.getUserProfile(userId);
        setProfile(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || '無法載入使用者資料');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        followersCount: isFollowing
          ? profile.followersCount + 1
          : profile.followersCount - 1,
      });
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || '找不到使用者'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {/* Profile Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {profile.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              加入日期：{new Date(profile.joinedDate).toLocaleDateString('zh-TW')}
            </Typography>
          </Box>
          {!isOwnProfile && userId && (
            <FollowButton
              userId={userId}
              isFollowing={false}
              onFollowChange={handleFollowChange}
            />
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Statistics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DirectionsRun sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5">{profile.totalRuns}</Typography>
                <Typography variant="body2" color="text.secondary">
                  總跑步次數
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Timeline sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h5">{profile.totalDistance.toFixed(1)} km</Typography>
                <Typography variant="body2" color="text.secondary">
                  總距離
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h5">
                  {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  平均評分
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Box
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${userId}/followers`)}
                  >
                    <Typography variant="h6">{profile.followersCount}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      追蹤者
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${userId}/following`)}
                  >
                    <Typography variant="h6">{profile.followingCount}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      追蹤中
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activities */}
        <Box>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarToday />
            最近活動
          </Typography>
          {profile.recentActivities.length === 0 ? (
            <Alert severity="info">尚無活動記錄</Alert>
          ) : (
            <Grid container spacing={2}>
              {profile.recentActivities.map((activity) => (
                <Grid item xs={12} sm={6} md={4} key={activity.id}>
                  <Card
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                    onClick={() => navigate(`/activities/${activity.id}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom noWrap>
                        {activity.title}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          日期：{new Date(activity.scheduledDate).toLocaleDateString('zh-TW')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          距離：{activity.distance} km
                        </Typography>
                        <Chip
                          label={
                            activity.status === 'upcoming'
                              ? '即將開始'
                              : activity.status === 'completed'
                              ? '已完成'
                              : activity.status === 'in-progress'
                              ? '進行中'
                              : '已取消'
                          }
                          color={
                            activity.status === 'upcoming'
                              ? 'primary'
                              : activity.status === 'completed'
                              ? 'success'
                              : activity.status === 'in-progress'
                              ? 'info'
                              : 'default'
                          }
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};
