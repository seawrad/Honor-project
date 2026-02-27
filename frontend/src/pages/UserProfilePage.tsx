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
  Alert,
  Divider,
  Chip,
  Tabs,
  Tab,
  Button,
  TextField,
  Avatar,
  IconButton,
  Skeleton,
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
import { useTranslation } from 'react-i18next';
import { userService } from '../services/user.service';
import { UserProfile, UserStatsSummary } from '../types/user.types';
import { FollowButton } from '../components/FollowButton';
import { LevelProgressBar } from '../components/LevelProgressBar';
import { ProfileSkeleton } from '../components/skeletons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ErrorToast';
import { RatingsList } from '../components/RatingsList';
import { AvatarCropDialog } from '../components/AvatarCropDialog';

const MAX_AVATAR_SIZE_KB = 5120;

export const UserProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
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
  const [stats, setStats] = useState<UserStatsSummary | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [pendingAvatarSrc, setPendingAvatarSrc] = useState<string | null>(null);
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
      setError(err.response?.data?.error?.message || t('loadUserFailed'));
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

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;
      try {
        const data = await userService.getUserStatsSummary(userId);
        setStats(data);
      } catch {
        setStats(null);
      }
    };
    fetchStats();
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
      showToast(t('saved'), 'success');
    } catch (err: any) {
      setSaveError(err.response?.data?.error?.message || t('updateFailed'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isOwnProfile) fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith('image/')) {
      setSaveError(t('selectImageFile'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_KB * 1024) {
      setSaveError(t('imageSizeLimit', { size: MAX_AVATAR_SIZE_KB / 1024 }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSaveError(null);
      setPendingAvatarSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropApply = async (croppedDataUrl: string) => {
    if (!userId || !profile) return;
    setCropDialogOpen(false);
    setPendingAvatarSrc(null);
    setSaveLoading(true);
    const previousAvatar = profile.avatarUrl;
    setProfile((prev) => (prev ? { ...prev, avatarUrl: croppedDataUrl } : null));
    try {
      const updated = await userService.updateUserProfile(userId, {
        avatarUrl: croppedDataUrl,
      });
      setProfile(updated);
      setAvatarVersion((v) => v + 1);
      showToast('頭像已更新', 'success');
    } catch (err: any) {
      setProfile((prev) => (prev ? { ...prev, avatarUrl: previousAvatar } : null));
      setSaveError(err.response?.data?.error?.message || t('avatarUpdateFailed'));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCropClose = () => {
    setCropDialogOpen(false);
    setPendingAvatarSrc(null);
  };

  if (!isLoading && (error || !profile)) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error || t('userNotFound')}</Alert>
      </Container>
    );
  }

  if (isLoading || !profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Button onClick={() => navigate(-1)}>{t('back')}</Button>
        </Box>
        <ProfileSkeleton />
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
              key={`avatar-${avatarVersion}-${profile.avatarUrl ? 'custom' : 'default'}`}
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
                  aria-label={t('changeAvatar')}
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
                <AvatarCropDialog
                  open={cropDialogOpen}
                  imageSrc={pendingAvatarSrc}
                  onClose={handleCropClose}
                  onApply={handleCropApply}
                />
              </>
            )}
          </Box>
          <Box sx={{ flex: 1, width: '100%' }}>
            {isEditing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('displayName')}
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  fullWidth
                  size="small"
                  required
                />
                <TextField
                  label={t('age')}
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
                    {saveLoading ? t('saving') : t('save')}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={handleCancelEdit}
                    disabled={saveLoading}
                  >
                    {t('cancel')}
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
                      {t('edit')}
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
                  {t('joinedDate')}：{new Date(profile.joinedDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-TW')}
                </Typography>
                {isOwnProfile && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('emailLabel')}：{profile.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('ageLabel')}：{profile.age}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <LevelProgressBar stats={stats} />

        {/* Statistics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DirectionsRun sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5">{profile.totalRuns}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('totalRuns')}
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
                  {t('totalDistance')}
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
                  {t('averageRating')}
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
                      {t('followers')}
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/users/${userId}/following`)}
                  >
                    <Typography variant="h6">{profile.followingCount}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('following')}
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
            <Tab icon={<CalendarToday />} label={t('recentActivities')} iconPosition="start" />
            <Tab icon={<RateReview />} label={t('ratings')} iconPosition="start" />
          </Tabs>
        </Box>

        {activeTab === 0 && (
          <Box>
            {(profile.recentActivities || []).length === 0 ? (
              <Alert severity="info">{t('noActivityRecords')}</Alert>
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
                            {t('date')}：{new Date(activity.scheduledDate).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-TW')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {t('distance')}：{activity.distance} {t('kmShort')}
                          </Typography>
                          <Chip
                            label={
                              activity.status === 'upcoming'
                                ? t('statusUpcoming')
                                : activity.status === 'completed'
                                ? t('statusCompleted')
                                : activity.status === 'in-progress'
                                ? t('statusInProgress')
                                : t('statusCancelled')
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
              <Box sx={{ py: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Paper key={i} sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Skeleton variant="text" width={120} height={24} />
                    </Box>
                    <Skeleton variant="text" width="80%" />
                  </Paper>
                ))}
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
