import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { activityService, Activity } from '../services/activity.service';
import { tokenStorage } from '../utils/tokenStorage';
import { useAppSettings } from '../contexts/SettingsContext';
import { userService, User, UserStatsSummary } from '../services/user.service';

const HomeScreen = ({ navigation }: any) => {
  const { formatDistanceKm, distanceUnitShort, themeColors, isDarkMode } = useAppSettings();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; displayName: string; email: string; age: number } | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create styles dynamically based on current theme
  const styles = createStyles({ ...themeColors, isDark: isDarkMode });

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const storedUser = await tokenStorage.getUser();
      setCurrentUser(storedUser);

      const result = await activityService.getActivities({ status: 'upcoming' }, 1, 10);
      setActivities(result.activities);

      if (storedUser?.id) {
        const [profileData, statsData] = await Promise.all([
          userService.getUserProfile(storedUser.id).catch(() => null),
          userService.getUserStatsSummary(storedUser.id).catch(() => null),
        ]);
        setProfile(profileData);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to load activities', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [loadActivities])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardText}>{item.location.address}</Text>
      <Text style={styles.cardDate}>{new Date(item.scheduledDate).toLocaleString()}</Text>
      <Text style={styles.cardText}>{formatDistanceKm(item.distance ?? 0)} {distanceUnitShort} • {item.maxParticipants || '∞'} participants</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const upcomingActivities = profile?.recentActivities?.filter((item) => item.status === 'upcoming') ?? [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Welcome to RunCrew</Text>
        <Text style={styles.heroGreeting}>Hello, {currentUser?.displayName ?? 'Runner'}!</Text>
        <Text style={styles.heroMeta}>Email: {currentUser?.email ?? 'Unknown'}</Text>
        <Text style={styles.heroMeta}>Age: {currentUser?.age ?? '-'}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={() => navigation.navigate('Activities')}>
            <Text style={styles.primaryActionText}>Explore Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('CreateActivity')}>
            <Text style={styles.secondaryActionText}>Create Activity</Text>
          </TouchableOpacity>
        </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('SoloRun')}>
              <Text style={styles.secondaryActionText}>Solo Run</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('UserSearch')}>
              <Text style={styles.secondaryActionText}>Search Users</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('Feed')}>
              <Text style={styles.secondaryActionText}>Open Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={() => navigation.navigate('RouteHistory')}>
              <Text style={styles.secondaryActionText}>Route History</Text>
            </TouchableOpacity>
          </View>
      </View>

      {!!stats && (
        <View style={styles.statsPanel}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <Text style={styles.statsLine}>Weekly distance: {formatDistanceKm(stats.weeklyDistanceKm)} {distanceUnitShort}</Text>
          <Text style={styles.statsLine}>Monthly completed: {stats.monthlyCompletedActivities}</Text>
          <Text style={styles.statsLine}>Level: {stats.level.name} ({formatDistanceKm(stats.level.currentKm)} {distanceUnitShort})</Text>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.header}>Upcoming Activities</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Activities')}>
          <Text style={styles.sectionLink}>See all</Text>
        </TouchableOpacity>
      </View>

      {upcomingActivities.length > 0 ? (
        <View style={styles.upcomingList}>
          {upcomingActivities.map((item) => (
            <TouchableOpacity key={item.id} style={styles.upcomingItem} onPress={() => navigation.navigate('ActivityDetail', { id: item.id })}>
              <Text style={styles.upcomingTitle}>{item.title}</Text>
              <Text style={styles.upcomingMeta}>{new Date(item.scheduledDate).toLocaleString()} • {formatDistanceKm(item.distance)} {distanceUnitShort}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No upcoming activities in your profile yet.</Text>
      )}

      <Text style={styles.header}>Discover More Runs</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities found</Text>
          </View>
        }
      />
    </ScrollView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 28,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroCard: {
      backgroundColor: colors.paper,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    heroGreeting: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    heroMeta: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    primaryAction: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryActionText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    secondaryAction: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.paper,
    },
    secondaryActionText: {
      color: colors.primaryDark,
      fontWeight: '700',
    },
    statsPanel: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.isDark ? 'rgba(77, 212, 237, 0.08)' : 'rgba(0, 184, 212, 0.08)',
      borderWidth: 1,
      borderColor: colors.isDark ? 'rgba(77, 212, 237, 0.2)' : 'rgba(0, 184, 212, 0.2)',
      marginBottom: 18,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    statsLine: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    header: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 12,
      marginTop: 8,
    },
    sectionLink: {
      color: colors.primaryDark,
      fontWeight: '600',
    },
    card: {
      backgroundColor: colors.paper,
      marginVertical: 8,
      padding: 15,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    cardText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    cardDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    upcomingList: {
      marginBottom: 12,
    },
    upcomingItem: {
      backgroundColor: colors.paper,
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.isDark ? colors.primary + '30' : 'rgba(0, 184, 212, 0.2)',
    },
    upcomingTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    upcomingMeta: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
  });

export default HomeScreen;
