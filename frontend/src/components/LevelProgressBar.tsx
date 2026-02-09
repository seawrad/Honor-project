import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import type { UserStatsSummary } from '../types/user.types';

interface LevelProgressBarProps {
  stats: UserStatsSummary | null;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ stats }) => {
  if (!stats) return null;

  const { level } = stats;
  const kmToNext = level.nextLevelKm != null ? level.nextLevelKm - level.currentKm : 0;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'rgba(0, 184, 212, 0.06)',
        border: '1px solid rgba(0, 184, 212, 0.2)',
        mb: 3,
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
        🏅 RunCrew 等級：{level.name}
      </Typography>
      {level.nextLevelKm != null ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              本月累計 {level.currentKm} km
            </Typography>
            <Typography variant="caption" color="text.secondary">
              再 {kmToNext.toFixed(1)} km 升級
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={level.progressPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(0, 184, 212, 0.2)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'primary.main',
              },
            }}
          />
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          已達最高等級！
        </Typography>
      )}
    </Box>
  );
};
