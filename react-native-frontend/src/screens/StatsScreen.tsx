import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSettings } from '../contexts/SettingsContext';
import { userService, UserStatsSummary } from '../services/user.service';
import { achievementService } from '../services/achievement.service';
import { tokenStorage } from '../utils/tokenStorage';
import { brandColors } from '../utils/brand';

const StatsScreen = () => {
  const { formatDistanceKm, distanceUnitShort } = useAppSettings();
  const [stats, setStats] = useState<UserStatsSummary | null>(null);
  const [unlockedCount, setUnlockedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const user = await tokenStorage.getUser();
      if (!user?.id) {
        throw new Error('No current user found');
      }
      const [statsData, achievementCount] = await Promise.all([
        userService.getUserStatsSummary(user.id),
        achievementService.getUnlockedCount().catch(() => null),
      ]);
      setStats(statsData);
      setUnlockedCount(achievementCount);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || loadError.message || 'Unable to load stats.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'No stats available.'}</Text>
      </View>
    );
  }

  const progress = Math.max(0, Math.min(stats.level.progressPercent, 100));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Stats</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.number}>{formatDistanceKm(stats.weeklyDistanceKm)}</Text>
          <Text style={styles.label}>Weekly {distanceUnitShort}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.number}>{stats.monthlyCompletedActivities}</Text>
          <Text style={styles.label}>Completed this month</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.number}>{formatDistanceKm(stats.monthlyDistanceKm)}</Text>
          <Text style={styles.label}>Monthly {distanceUnitShort}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.number}>{unlockedCount ?? '-'}</Text>
          <Text style={styles.label}>Unlocked achievements</Text>
        </View>
      </View>

      <View style={styles.levelCard}>
        <Text style={styles.levelName}>{stats.level.name}</Text>
        <Text style={styles.levelSub}>Current distance: {formatDistanceKm(stats.level.currentKm)} {distanceUnitShort}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.levelSub}>
          {stats.level.nextLevelKm ? `${formatDistanceKm(stats.level.nextLevelKm)} ${distanceUnitShort} to next level` : 'Top level reached'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 12,
  },
  error: {
    color: '#B91C1C',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  number: {
    fontSize: 24,
    fontWeight: '800',
    color: brandColors.primaryDark,
  },
  label: {
    color: brandColors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 12,
    padding: 14,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 4,
  },
  levelSub: {
    fontSize: 13,
    color: brandColors.textSecondary,
    marginBottom: 8,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#DBF3FA',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 10,
    backgroundColor: brandColors.primary,
  },
});

export default StatsScreen;
