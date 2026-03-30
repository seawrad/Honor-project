import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Achievement, achievementService } from '../services/achievement.service';
import { brandColors } from '../utils/brand';

const AchievementsScreen = () => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const data = await achievementService.getMyAchievements();
      setItems(data);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || 'Unable to load achievements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAchievements();
    }, [loadAchievements])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Achievements</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.isUnlocked && styles.lockedCard]}>
            <Text style={styles.icon}>{item.icon || '🏅'}</Text>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <Text style={styles.status}>{item.isUnlocked ? 'Unlocked' : 'Locked'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No achievements available yet.</Text>}
      />
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
  error: {
    color: '#B91C1C',
    marginBottom: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  lockedCard: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: brandColors.textSecondary,
    minHeight: 34,
  },
  status: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '700',
    color: brandColors.primaryDark,
  },
  empty: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 28,
  },
});

export default AchievementsScreen;
