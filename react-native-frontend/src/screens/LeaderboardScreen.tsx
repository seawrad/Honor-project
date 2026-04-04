import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LeaderboardEntry, LeaderboardType, leaderboardService } from '../services/leaderboard.service';
import { brandColors } from '../utils/brand';

const MODES: Array<{ label: string; value: LeaderboardType }> = [
  { label: 'Weekly km', value: 'weekly_km' },
  { label: 'Monthly km', value: 'monthly_km' },
  { label: 'Weekly runs', value: 'weekly_runs' },
  { label: 'Monthly runs', value: 'monthly_runs' },
];

const LeaderboardScreen = () => {
  const [mode, setMode] = useState<LeaderboardType>('weekly_km');
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLeaderboard = useCallback(async (nextMode: LeaderboardType) => {
    setLoading(true);
    try {
      setError('');
      const data = await leaderboardService.getLeaderboard(nextMode);
      setItems(data);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || 'Unable to load leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard(mode);
    }, [loadLeaderboard, mode])
  );

  const handleModeChange = async (nextMode: LeaderboardType) => {
    setMode(nextMode);
    await loadLeaderboard(nextMode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      <View style={styles.modeWrap}>
        {MODES.map((modeOption) => (
          <TouchableOpacity
            key={modeOption.value}
            style={[styles.modeChip, modeOption.value === mode && styles.modeChipActive]}
            onPress={() => handleModeChange(modeOption.value)}
          >
            <Text style={[styles.modeChipText, modeOption.value === mode && styles.modeChipTextActive]}>
              {modeOption.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.userId}-${item.rank}`}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.value}>{item.value} {item.unit}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No leaderboard data yet.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: brandColors.background,
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
  modeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  modeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFEAF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  modeChipActive: {
    backgroundColor: brandColors.primary,
    borderColor: brandColors.primary,
  },
  modeChipText: {
    color: brandColors.primaryDark,
    fontWeight: '600',
    fontSize: 12,
  },
  modeChipTextActive: {
    color: '#FFFFFF',
  },
  error: {
    color: '#B91C1C',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rank: {
    width: 52,
    fontWeight: '800',
    color: brandColors.primaryDark,
  },
  name: {
    flex: 1,
    color: brandColors.textPrimary,
    fontWeight: '600',
  },
  value: {
    color: brandColors.textSecondary,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 26,
  },
});

export default LeaderboardScreen;
