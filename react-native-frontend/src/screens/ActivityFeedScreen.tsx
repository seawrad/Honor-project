import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Activity, activityService } from '../services/activity.service';
import { brandColors } from '../utils/brand';

const PAGE_SIZE = 10;

const ActivityFeedScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const loadPage = useCallback(async (nextPage: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      setError('');
      const response = await activityService.getFeed(nextPage, PAGE_SIZE);
      setItems((prev) => (append ? [...prev, ...response.activities] : response.activities));
      setPage(nextPage);
      setHasMore(nextPage * response.limit < response.total);
    } catch (loadError: any) {
      setError(loadError.response?.data?.error?.message || 'Unable to load feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPage(1, false);
    }, [loadPage])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPage(1, false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }
    await loadPage(page + 1, true);
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
      <Text style={styles.title}>Following Feed</Text>
      <Text style={styles.subtitle}>Recent runs from people you follow</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.creatorName}</Text>
            <Text style={styles.meta}>{item.location.address}</Text>
            <Text style={styles.meta}>{new Date(item.scheduledDate).toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No feed items yet.</Text>}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.loadMore} onPress={onLoadMore} disabled={loadingMore}>
              {loadingMore ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loadMoreText}>Load More</Text>}
            </TouchableOpacity>
          ) : null
        }
      />
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
  },
  subtitle: {
    color: brandColors.textSecondary,
    marginBottom: 12,
  },
  error: {
    color: '#B91C1C',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5F6FB',
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: brandColors.textSecondary,
    marginBottom: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 28,
  },
  loadMore: {
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: brandColors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default ActivityFeedScreen;
