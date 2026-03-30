import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { userService, User } from '../services/user.service';
import { tokenStorage } from '../utils/tokenStorage';
import { brandColors } from '../utils/brand';

const UserSearchScreen = ({ navigation }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    tokenStorage.getUser().then((user) => {
      if (active) {
        setCurrentUserId(user?.id ?? null);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const users = await userService.searchUsers(query.trim());
        if (active) {
          setResults(users);
        }
      } catch (searchError: any) {
        if (active) {
          setError(searchError?.response?.data?.error?.message || 'Unable to search users right now.');
          setResults([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const visibleResults = useMemo(
    () => results.filter((user) => user.id !== currentUserId),
    [currentUserId, results]
  );

  const handleFollowToggle = async (user: User) => {
    const nextIsFollowing = !user.isFollowing;

    setResults((prev) =>
      prev.map((item) => (item.id === user.id ? { ...item, isFollowing: nextIsFollowing } : item))
    );

    try {
      if (nextIsFollowing) {
        await userService.followUser(user.id);
      } else {
        await userService.unfollowUser(user.id);
      }
    } catch {
      setResults((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, isFollowing: user.isFollowing } : item))
      );
      setError('Unable to update follow state. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Search Users</Text>
      <Text style={styles.subtitle}>Find runners, open profiles, and follow people from the mobile app.</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or email"
        placeholderTextColor="#94A3B8"
        style={styles.searchInput}
        autoCapitalize="none"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandColors.primaryDark} />
        </View>
      ) : visibleResults.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{query.trim() ? 'No matching users' : 'Start discovering runners'}</Text>
          <Text style={styles.emptyText}>
            {query.trim()
              ? 'Try a different search term.'
              : 'Type a name to browse the community.'}
          </Text>
        </View>
      ) : (
        visibleResults.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userCard}
            onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
          >
            <View style={styles.userMain}>
              <Text style={styles.userName}>{user.displayName}</Text>
              <Text style={styles.userMeta}>{user.email}</Text>
              <Text style={styles.userMeta}>
                {user.totalRuns} runs • {user.followersCount} followers
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.followButton, user.isFollowing ? styles.followingButton : null]}
              onPress={() => handleFollowToggle(user)}
            >
              <Text style={[styles.followButtonText, user.isFollowing ? styles.followingButtonText : null]}>
                {user.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7EEF6',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: brandColors.textPrimary,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 12,
    fontWeight: '600',
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5F6FB',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  userMain: {
    flex: 1,
    paddingRight: 12,
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
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: brandColors.primaryDark,
  },
  followingButton: {
    backgroundColor: '#E2E8F0',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  followingButtonText: {
    color: brandColors.textPrimary,
  },
});

export default UserSearchScreen;