import React from 'react';
import { Box, Typography } from '@mui/material';
import type { UserStatsSummary as UserStatsSummaryType } from '../types/user.types';

interface UserStatsSummaryProps {
  stats: UserStatsSummaryType | null;
}

export const UserStatsSummary: React.FC<UserStatsSummaryProps> = ({ stats }) => {
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
        🏃‍♂️ 本週總里數：{stats.weeklyDistanceKm} km
      </Typography>
      <Typography variant="body1" sx={{ mb: 0.5 }}>
        🔥 本月已完成：{stats.monthlyCompletedActivities} 次活動
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        🏅 RunCrew 等級：{stats.level.name}
      </Typography>
    </Box>
  );
};
