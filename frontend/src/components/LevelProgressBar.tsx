import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, LinearProgress } from '@mui/material';
import type { UserStatsSummary } from '../types/user.types';

interface LevelProgressBarProps {
  stats: UserStatsSummary | null;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({ stats }) => {
  const { t, i18n } = useTranslation();
  if (!stats) return null;

  const { level } = stats;
  const levelName = i18n.language === 'zh-TW' ? level.nameZh : level.name;
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
        🏅 {t('runcrewLevelLabel')}: {levelName}
      </Typography>
      {level.nextLevelKm != null ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {t('monthlyAccumulatedKm', { km: level.currentKm })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('runMoreToLevelUp', { km: kmToNext.toFixed(1) })}
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
          {t('maxLevelReached')}
        </Typography>
      )}
    </Box>
  );
};
