import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { brandColors } from '../utils/brand';
import { userService, User } from '../services/user.service';

const SocialConnectionsScreen = ({ navigation, route }: any) => {
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(route?.params?.initialTab || 'followers');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = route?.params?.userId as string | undefined;

  const loadConnections = useCallback(async () => {
    if (!userId) {
      setError('Missing user id.');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [followerData, followingData] = await Promise.all([
        userService.getFollowers(userId),
        userService.getFollowing(userId),
      ]);
      setFollowers(followerData);
      setFollowing(followingData);
    } catch (loadError: any) {
      setError(loadError?.response?.data?.error?.message || 'Unable to load connections.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadConnections();
    }, [loadConnections])
  );

  const visibleUsers = useMemo(
    () => (activeTab === 'followers' ? followers : following),
    [activeTab, followers, following]
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadConnections();
  };

  const renderUserCard = (user: User) => (
    <TouchableOpacity
      key={`${activeTab}-${user.id}`}
      style={styles.userCard}
      onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
    >
      <Text style={styles.userName}>{user.displayName}</Text>
      <Text style={styles.userMeta}>{user.email}</Text>
      <Text style={styles.userMeta}>
        {user.totalRuns} runs • {user.followersCount} followers
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Social Connections</Text>
      <Text style={styles.subtitle}>See who follows this runner and who they follow back.</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'followers' ? styles.activeTabButton : null]}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' ? styles.activeTabText : null]}>
            Followers {followers.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'following' ? styles.activeTabButton : null]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' ? styles.activeTabText : null]}>
            Following {following.length}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColors.primaryDark} />
        </View>
      ) : error ? (
        <View style={styles.messageCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : visibleUsers.length === 0 ? (
        <View style={styles.messageCard}>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'followers'
              ? 'This runner has no followers yet.'
              : 'This runner is not following anyone yet.'}
          </Text>
        </View>
      ) : (
        visibleUsers.map(renderUserCard)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginBottom: 16,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7EEF6',
  },
  activeTabButton: {
    backgroundColor: brandColors.primaryDark,
    borderColor: brandColors.primaryDark,
  },
  tabText: {
    color: brandColors.textPrimary,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5F6FB',
  },
  errorText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5F6FB',
    marginBottom: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 13,
    color: brandColors.textSecondary,
    marginBottom: 3,
  },
});

export default SocialConnectionsScreen;