import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import type { UserStatsSummary as UserStatsSummaryType } from '../types/user.types';

interface UserStatsSummaryProps {
  stats: UserStatsSummaryType | null;
}

export const UserStatsSummary: React.FC<UserStatsSummaryProps> = ({ stats }) => {
  const { t, i18n } = useTranslation();
  if (!stats) return null;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(0, 184, 212, 0.08)',
        border: '1px solid rgba(0, 184, 212, 0.2)',
        minWidth: { xs: '100%', sm: 200 },
      }}
    >
      <Typography variant="body1" sx={{ mb: 0.5 }}>
        🏃‍♂️ {t('weeklyTotalKm', { km: stats.weeklyDistanceKm })}
      </Typography>
      <Typography variant="body1" sx={{ mb: 0.5 }}>
        🔥 {t('monthlyCompletedActivities', { count: stats.monthlyCompletedActivities })}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        🏅 {t('runcrewLevelLabel')}: {i18n.language === 'zh-TW' ? stats.level.nameZh : stats.level.name}
      </Typography>
    </Box>
  );
};
