import React, { useEffect, useState, useRef } from 'react';
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
  Tabs,
  Tab,
  Button,
  TextField,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  DirectionsRun,
  Timeline,
  Star,
  People,
  CalendarToday,
  RateReview,
  Edit as EditIcon,
  Save,
  Close,
  PhotoCamera,
} from '@mui/icons-material';
import { userService } from '../services/user.service';
import { UserProfile } from '../types/user.types';
import { FollowButton } from '../components/FollowButton';
import { useAuth } from '../hooks/useAuth';
import { RatingsList } from '../components/RatingsList';

const MAX_AVATAR_SIZE_KB = 500;

export const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAge, setEditAge] = useState<number>(18);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === userId;

  const fetchProfile = async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getUserProfile(userId);
      setProfile(data);
      setEditDisplayName(data.displayName);
      setEditAge(data.age ?? 18);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '無法載入使用者資料');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!userId || activeTab !== 1) return;
      setRatingsLoading(true);
      try {
        const data = await userService.getUserRatings(userId);
        setRatings(data.ratings);
        setAverageRating(data.averageRating);
        setTotalRatings(data.totalRatings);
      } catch (err) {
        console.error('Failed to load ratings:', err);
      } finally {
        setRatingsLoading(false);
      }
    };
    fetchRatings();
  }, [userId, activeTab]);

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

  const handleStartEdit = () => {
    if (profile) {
      setEditDisplayName(profile.displayName);
      setEditAge(profile.age ?? 18);
      setIsEditing(true);
      setSaveError(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaveLoading(true);
    setSaveError(null);
    try {
      const updated = await userService.updateUserProfile(userId, {
        displayName: editDisplayName.trim(),
        age: editAge,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.response?.data?.error?.message || '更新失敗');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) {
      setSaveError('請選擇圖片檔案 (JPG, PNG 等)');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_KB * 1024) {
      setSaveError(`圖片大小不可超過 ${MAX_AVATAR_SIZE_KB} KB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setSaveLoading(true);
      setSaveError(null);
      try {
        const updated = await userService.updateUserProfile(userId, {
          avatarUrl: dataUrl,
        });
        setProfile(updated);
      } catch (err: any) {
        setSaveError(err.response?.data?.error?.message || '頭像更新失敗');
      } finally {
        setSaveLoading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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
        {/* Profile Header with Avatar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 3,
            mb: 3,
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile.avatarUrl || undefined}
              sx={{
                width: 120,
                height: 120,
                fontSize: 48,
                cursor: isOwnProfile ? 'pointer' : 'default',
                border: '4px solid',
                borderColor: 'primary.main',
              }}
              onClick={handleAvatarClick}
            >
              {!profile.avatarUrl && profile.displayName.charAt(0).toUpperCase()}
            </Avatar>
            {isOwnProfile && (
              <>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }}
                  size="small"
                  onClick={handleAvatarClick}
                  aria-label="更換頭像"
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </Box>
          <Box sx={{ flex: 1, width: '100%' }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="顯示名稱"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  fullWidth
                  size="small"
                  required
                />
                <TextField
                  label="年齡"
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(parseInt(e.target.value) || 18)}
                  inputProps={{ min: 18, max: 65 }}
                  fullWidth
                  size="small"
                  required
                />
                {saveError && (
                  <Alert severity="error" onClose={() => setSaveError(null)}>
                    {saveError}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saveLoading || !editDisplayName.trim()}
                  >
                    {saveLoading ? '儲存中...' : '儲存'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={handleCancelEdit}
                    disabled={saveLoading}
                  >
                    取消
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h4">{profile.displayName}</Typography>
                  {isOwnProfile && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleStartEdit}
                    >
                      編輯
                    </Button>
                  )}
                  {!isOwnProfile && userId && (
                    <FollowButton
                      userId={userId}
                      isFollowing={profile.isFollowing ?? false}
                      onFollowChange={handleFollowChange}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  加入日期：{new Date(profile.joinedDate).toLocaleDateString('zh-TW')}
                </Typography>
                {isOwnProfile && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      電子郵件：{profile.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      年齡：{profile.age}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
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

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab icon={<CalendarToday />} label="最近活動" iconPosition="start" />
            <Tab icon={<RateReview />} label="評價" iconPosition="start" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box>
            {(profile.recentActivities || []).length === 0 ? (
              <Alert severity="info">尚無活動記錄</Alert>
            ) : (
              <Grid container spacing={2}>
                {(profile.recentActivities || []).map((activity) => (
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
        )}

        {activeTab === 1 && (
          <Box>
            {ratingsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <RatingsList
                ratings={ratings}
                averageRating={averageRating}
                totalRatings={totalRatings}
              />
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};
