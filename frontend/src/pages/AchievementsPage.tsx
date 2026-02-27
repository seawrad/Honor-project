import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import { useTranslation } from 'react-i18next';
import { achievementService, Achievement } from '../services/achievement.service';
import { AchievementCardSkeleton } from '../components/skeletons';

export const AchievementsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh-TW';
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    achievementService
      .getMyAchievements()
      .then((data) => {
        if (!cancelled) setAchievements(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error?.message || t('loadAchievementsFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <EmojiEventsIcon color="primary" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4" component="h1">
            {t('achievementBadges')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('unlockedCount', { unlocked: unlockedCount, total: totalCount })}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <AchievementCardSkeleton />
            </Grid>
          ))
        ) : (
          achievements.map((a) => (
            <Grid item xs={12} sm={6} md={4} key={a.id}>
            <Tooltip title={a.isUnlocked ? (isZh ? a.descriptionZh : a.description) : (isZh ? a.descriptionZh : a.description) + ' ' + t('notUnlockedYet')}>
              <Card
                sx={{
                  opacity: a.isUnlocked ? 1 : 0.65,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-2px)' },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box
                    sx={{
                      fontSize: 48,
                      mb: 1,
                      filter: a.isUnlocked ? 'none' : 'grayscale(100%)',
                    }}
                  >
                    {a.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {isZh ? a.nameZh : a.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {isZh ? a.descriptionZh : a.description}
                  </Typography>
                  {a.isUnlocked ? (
                    <Chip
                      icon={<EmojiEventsIcon />}
                      label={t('unlocked')}
                      color="success"
                      size="small"
                      sx={{ mt: 1.5 }}
                    />
                  ) : (
                    <Chip
                      icon={<LockIcon />}
                      label={t('locked')}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1.5 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Tooltip>
            </Grid>
          )))}
      </Grid>
    </Container>
  );
};
