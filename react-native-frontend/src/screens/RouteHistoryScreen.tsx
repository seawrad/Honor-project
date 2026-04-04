import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RoutePreview from '../components/RoutePreview';
import { useAppSettings } from '../contexts/SettingsContext';
import { gpsService, PerformanceMetrics, RouteData } from '../services/gps.service';
import { memoryCardService, RunMemoryCard } from '../services/memoryCard.service';
import { tokenStorage } from '../utils/tokenStorage';
import { brandColors } from '../utils/brand';

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

const RouteHistoryScreen = ({ navigation }: any) => {
  const { formatDistanceKm, formatSpeedKmh, distanceUnitShort, speedUnitShort } = useAppSettings();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [routeDetailsMap, setRouteDetailsMap] = useState<Record<string, RouteData>>({});
  const [metricsMap, setMetricsMap] = useState<Record<string, PerformanceMetrics>>({});
  const [memoryCardsMap, setMemoryCardsMap] = useState<Record<string, RunMemoryCard[]>>({});
  const [creatingCardId, setCreatingCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const user = await tokenStorage.getUser();
      if (!user?.id) {
        throw new Error('No current user found');
      }
      const data = await gpsService.getUserRoutes(user.id, 1, 20);
      setRoutes(data);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || loadError.message || 'Unable to load route history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutes();
    }, [loadRoutes])
  );

  const toggleExpanded = async (routeId: string) => {
    if (expandedId === routeId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(routeId);

    if (!routeDetailsMap[routeId]?.positions?.length) {
      try {
        const routeDetails = await gpsService.getRouteById(routeId);
        setRouteDetailsMap((prev) => ({ ...prev, [routeId]: routeDetails }));
      } catch {
        // Keep the summary visible even if detail fetch fails.
      }
    }

    if (!metricsMap[routeId]) {
      try {
        const metrics = await gpsService.getRouteMetrics(routeId);
        setMetricsMap((prev) => ({ ...prev, [routeId]: metrics }));
      } catch {
        // Ignore metrics errors and keep summary view available.
      }
    }
    if (!memoryCardsMap[routeId]) {
      try {
        const cards = await memoryCardService.getByRouteId(routeId);
        setMemoryCardsMap((prev) => ({ ...prev, [routeId]: cards }));
      } catch {
        setMemoryCardsMap((prev) => ({ ...prev, [routeId]: [] }));
      }
    }
  };

  const handleShareRoute = async (route: RouteData, metrics?: PerformanceMetrics) => {
    const duration = metrics?.duration ?? route.duration ?? 0;
    const distance = metrics?.totalDistance ?? route.totalDistance ?? 0;
    const averageSpeed = metrics?.averageSpeed ?? route.averageSpeed ?? 0;

    await Share.share({
      title: route.activity?.title || 'RunCrew Route',
      message: `${route.activity?.title || 'Solo Route'} · ${formatDistanceKm(Number(distance))} ${distanceUnitShort} · ${formatDuration(Number(duration))} · ${formatSpeedKmh(Number(averageSpeed))} ${speedUnitShort}`,
    });
  };

  const handleCreateMemoryCard = async (route: RouteData) => {
    setCreatingCardId(route.id);
    try {
      const card = await memoryCardService.create({
        activityId: route.activityId ?? null,
        routeId: route.id,
        runDate: new Date(route.startTime || route.createdAt).toISOString().slice(0, 10),
        participantCount: route.activityId ? 1 : 1,
        totalDistance: route.totalDistance ?? 0,
        averageSpeed: route.averageSpeed ?? 0,
        durationSeconds: route.duration ?? 0,
        routeSummary: route.positions ? { pointCount: route.positions.length } : undefined,
      });
      setMemoryCardsMap((prev) => ({
        ...prev,
        [route.id]: [...(prev[route.id] ?? []), card],
      }));
      navigation.navigate('MemoryCard', { cardId: card.id });
    } catch (createError: any) {
      Alert.alert('Create Memory Card Failed', createError.response?.data?.error?.message || 'Unable to create a memory card right now.');
    } finally {
      setCreatingCardId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Route History</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={routes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const routeDetails = routeDetailsMap[item.id] ?? item;
          const metrics = metricsMap[item.id];
          const memoryCards = memoryCardsMap[item.id] ?? [];
          const isExpanded = expandedId === item.id;
          return (
            <TouchableOpacity style={styles.card} onPress={() => toggleExpanded(item.id)}>
              <Text style={styles.cardTitle}>{item.activity?.title || 'Solo Route'}</Text>
              <Text style={styles.meta}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={styles.meta}>
                {formatDistanceKm(item.totalDistance)} {distanceUnitShort} • {formatDuration(item.duration)} • {formatSpeedKmh(item.averageSpeed)} {speedUnitShort}
              </Text>

              {!!item.activityId && (
                <TouchableOpacity
                  style={styles.activityButton}
                  onPress={() => navigation.navigate('ActivityDetail', { id: item.activityId })}
                >
                  <Text style={styles.activityButtonText}>Open Activity</Text>
                </TouchableOpacity>
              )}

              {isExpanded && metrics && (
                <View style={styles.metricsBox}>
                  <RoutePreview
                    title="Route Visualization"
                    positions={routeDetails.positions ?? []}
                    emptyLabel="Open this route again after GPS points are available to visualize it here."
                  />

                  <Text style={styles.metricsTitle}>Metrics</Text>
                  <Text style={styles.meta}>Distance: {formatDistanceKm(metrics.totalDistance)} {distanceUnitShort}</Text>
                  <Text style={styles.meta}>Average speed: {formatSpeedKmh(metrics.averageSpeed)} {speedUnitShort}</Text>
                  <Text style={styles.meta}>Duration: {formatDuration(metrics.duration)}</Text>
                  <Text style={styles.meta}>Start: {new Date(routeDetails.startTime || routeDetails.createdAt).toLocaleString()}</Text>
                  <Text style={styles.meta}>End: {new Date(routeDetails.endTime || routeDetails.createdAt).toLocaleString()}</Text>
                  <Text style={styles.meta}>GPS points: {routeDetails.positions?.length ?? 0}</Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.secondaryActionButton} onPress={() => handleShareRoute(routeDetails, metrics)}>
                      <Text style={styles.secondaryActionButtonText}>Share Route</Text>
                    </TouchableOpacity>
                    {!!item.activityId && (
                      <TouchableOpacity
                        style={styles.secondaryActionButton}
                        onPress={() => navigation.navigate('ActivityDetail', { id: item.activityId })}
                      >
                        <Text style={styles.secondaryActionButtonText}>Open Activity</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.memoryCardBox}>
                    <Text style={styles.metricsTitle}>Run Memory Card</Text>
                    {memoryCards.length > 0 ? (
                      <View style={styles.memoryCardList}>
                        {memoryCards.map((card) => (
                          <TouchableOpacity key={card.id} style={styles.memoryCardButton} onPress={() => navigation.navigate('MemoryCard', { cardId: card.id })}>
                            <Text style={styles.memoryCardButtonText}>View {new Date(card.runDate).toLocaleDateString()}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.createCardButton} onPress={() => handleCreateMemoryCard(item)} disabled={creatingCardId === item.id}>
                        {creatingCardId === item.id ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.createCardButtonText}>Create Memory Card</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No routes tracked yet.</Text>}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5F6FB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 5,
  },
  meta: {
    fontSize: 13,
    color: brandColors.textSecondary,
    marginBottom: 2,
  },
  activityButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#E5F6FB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  activityButtonText: {
    color: brandColors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  metricsBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  secondaryActionButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5F6FB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  secondaryActionButtonText: {
    color: brandColors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  memoryCardBox: {
    marginTop: 12,
  },
  memoryCardList: {
    gap: 8,
    marginTop: 6,
  },
  memoryCardButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7EEF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  memoryCardButtonText: {
    color: brandColors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  createCardButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: brandColors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  createCardButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  metricsTitle: {
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 4,
  },
  empty: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 26,
  },
});

export default RouteHistoryScreen;
