import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSettings } from '../contexts/SettingsContext';
import { Activity, activityService } from '../services/activity.service';

const ActivityListScreen = ({ navigation }: any) => {
  const { formatDistanceKm, distanceUnitShort } = useAppSettings();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadActivities = useCallback(async () => {
    setError('');
    try {
      const result = await activityService.getActivities({}, 1, 25);
      setActivities(result.activities);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || 'Unable to load activities.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadActivities();
    }, [loadActivities])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>All Activities</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('CreateActivity')}>
          <Text style={styles.createButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{item.location.address}</Text>
            <Text style={styles.cardMeta}>{new Date(item.scheduledDate).toLocaleString()}</Text>
            <Text style={styles.cardMeta}>
              {formatDistanceKm(item.distance ?? 0)} {distanceUnitShort} • {item.maxParticipants ?? 0} spots
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.placeholder}>No activities yet. Create the first one.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  placeholder: {
    marginTop: 24,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ActivityListScreen;
