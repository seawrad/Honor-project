import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Alert,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import FlagIcon from '@mui/icons-material/Flag';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/user.service';
import { goalService, UserGoal } from '../services/goal.service';
import type { UserStatsSummary } from '../types/user.types';
import { StatsCardSkeleton } from '../components/skeletons';

export const StatsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStatsSummary | null>(null);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalType, setGoalType] = useState<'weekly' | 'monthly'>('weekly');
  const [goalValue, setGoalValue] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError(null);
        const [statsData, goalsData] = await Promise.all([
          userService.getUserStatsSummary(user.id),
          goalService.getMyGoals(),
        ]);
        setStats(statsData);
        setGoals(goalsData);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || t('loadFailed'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleSetGoal = async () => {
    const val = parseFloat(goalValue);
    if (isNaN(val) || val <= 0) return;
    setSavingGoal(true);
    try {
      const goal = goalType === 'weekly'
        ? await goalService.setWeeklyGoal(val)
        : await goalService.setMonthlyGoal(val);
      setGoals((prev) => {
        const filtered = prev.filter((g) => !(g.goalType === goal.goalType && g.periodStart === goal.periodStart));
        return [...filtered, { ...goal, currentValue: 0, progressPercent: 0 }];
      });
      setGoalDialogOpen(false);
      setGoalValue('');
      // Reload goals to get current values
      const updated = await goalService.getMyGoals();
      setGoals(updated);
    } catch (err) {
      console.error('Failed to set goal:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  const openGoalDialog = (type: 'weekly' | 'monthly') => {
    setGoalType(type);
    setGoalDialogOpen(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h4" component="h1">
          {t('runningStats')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {loading ? (
          <>
            <Grid item xs={12} sm={4}>
              <StatsCardSkeleton />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatsCardSkeleton />
            </Grid>
            <Grid item xs={12} sm={4}>
              <StatsCardSkeleton />
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 2 }} />
              </Paper>
            </Grid>
          </>
        ) : stats && (
          <>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <DirectionsRunIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h5" fontWeight={700}>
                  {stats.weeklyDistanceKm} km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('weeklyDistance')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700} color="secondary">
                  {t('activitiesCountTimes', { count: stats.monthlyCompletedActivities })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('monthlyCompleted')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={700} color="success.main">
                  {stats.monthlyDistanceKm} km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('monthlyDistance')}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {t('runcrewLevel')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">
                    {i18n.language === 'zh-TW' ? stats.level.nameZh : stats.level.name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.level.progressPercent}
                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {stats.level.progressPercent}%
                  </Typography>
                </Box>
                {stats.level.nextLevelKm && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {t('runMoreToLevelUp', { km: stats.level.nextLevelKm - stats.level.currentKm })}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('goalSettings')}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" onClick={() => openGoalDialog('weekly')}>
                {t('weeklyGoal')}
              </Button>
              <Button size="small" variant="outlined" onClick={() => openGoalDialog('monthly')}>
                {t('monthlyGoal')}
              </Button>
            </Box>
          </Box>
          {goals.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <FlagIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="text.secondary">
                {t('setGoalDesc')}
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 2 }}>
              {goals.map((g) => (
                <Box key={g.id} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      {g.goalType === 'weekly_km' ? t('weeklyTarget', { current: g.currentValue ?? 0, target: g.targetValue }) : t('monthlyTarget', { current: g.currentValue ?? 0, target: g.targetValue })}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {g.progressPercent ?? 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, g.progressPercent ?? 0)}
                    color="primary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)}>
        <DialogTitle>{goalType === 'weekly' ? t('setWeeklyGoal') : t('setMonthlyGoal')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('targetKm')}
            type="number"
            fullWidth
            value={goalValue}
            onChange={(e) => setGoalValue(e.target.value)}
            inputProps={{ min: 1, step: 0.5 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handleSetGoal} variant="contained" disabled={savingGoal || !goalValue}>
            {savingGoal ? t('setting') : t('setGoal')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
