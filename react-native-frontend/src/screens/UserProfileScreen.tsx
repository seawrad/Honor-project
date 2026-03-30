import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppSettings } from '../contexts/SettingsContext';
import { tokenStorage } from '../utils/tokenStorage';
import { brandColors } from '../utils/brand';
import { userService, User, UserStatsSummary } from '../services/user.service';
import { authService } from '../services/auth.service';

const UserProfileScreen = ({ navigation, route }: any) => {
  const { formatDistanceKm, distanceUnitShort } = useAppSettings();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStatsSummary | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editAge, setEditAge] = useState('18');
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const MAX_AVATAR_SIZE_BYTES = 1_500_000;

  const onLogout = route?.params?.onLogout as (() => void) | undefined;
  const routeUserId = route?.params?.userId as string | undefined;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const storedUser = await tokenStorage.getUser();
      if (!storedUser?.id) {
        throw new Error('No user found');
      }

      const targetUserId = routeUserId || storedUser.id;
      setIsOwnProfile(targetUserId === storedUser.id);

      const [currentUser, userStats] = await Promise.all([
        userService.getUserProfile(targetUserId),
        userService.getUserStatsSummary(targetUserId),
      ]);

      setUser(currentUser);
      setStats(userStats);
      setEditDisplayName(currentUser.displayName);
      setEditAge(String(currentUser.age ?? 18));
    } catch (error) {
      console.error('Failed to load profile', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleStartEdit = () => {
    if (!user) {
      return;
    }

    setEditDisplayName(user.displayName);
    setEditAge(String(user.age ?? 18));
    setSaveError('');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    const parsedAge = Number(editAge);
    if (!editDisplayName.trim()) {
      setSaveError('Display name is required.');
      return;
    }

    if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 65) {
      setSaveError('Age must be a whole number between 18 and 65.');
      return;
    }

    setSaveLoading(true);
    setSaveError('');

    try {
      const updatedUser = await userService.updateUserProfile({
        id: user.id,
        displayName: editDisplayName.trim(),
        age: parsedAge,
      });

      setUser(updatedUser);
      setIsEditing(false);
    } catch (error: any) {
      setSaveError(error.response?.data?.error?.message || 'Unable to update profile right now.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePickAvatar = async () => {
    if (!user || !isOwnProfile) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Photo library permission is needed to update your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Avatar update failed', 'Unable to read selected image data.');
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE_BYTES) {
      Alert.alert('Image too large', 'Please choose an image under 1.5 MB.');
      return;
    }

    setAvatarLoading(true);
    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const avatarUrl = `data:${mimeType};base64,${asset.base64}`;
      const updatedUser = await userService.updateUserProfile({ id: user.id, avatarUrl });
      setUser(updatedUser);

      if (isOwnProfile) {
        const storedUser = await tokenStorage.getUser();
        if (storedUser) {
          await tokenStorage.setUser({
            ...storedUser,
            avatarUrl: updatedUser.avatarUrl,
            displayName: updatedUser.displayName,
            age: updatedUser.age,
          });
        }
      }
    } catch (error: any) {
      Alert.alert('Avatar update failed', error.response?.data?.error?.message || 'Unable to update avatar right now.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !isOwnProfile) {
      return;
    }

    setAvatarLoading(true);
    try {
      const updatedUser = await userService.updateUserProfile({ id: user.id, avatarUrl: null });
      setUser(updatedUser);
      const storedUser = await tokenStorage.getUser();
      if (storedUser) {
        await tokenStorage.setUser({ ...storedUser, avatarUrl: null });
      }
    } catch (error: any) {
      Alert.alert('Avatar update failed', error.response?.data?.error?.message || 'Unable to remove avatar right now.');
    } finally {
      setAvatarLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{user.displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        {isOwnProfile ? (
          <View style={styles.avatarActionRow}>
            <TouchableOpacity style={styles.avatarButton} onPress={handlePickAvatar} disabled={avatarLoading}>
              <Text style={styles.avatarButtonText}>{avatarLoading ? 'Updating...' : 'Change Avatar'}</Text>
            </TouchableOpacity>
            {user.avatarUrl ? (
              <TouchableOpacity style={styles.avatarRemoveButton} onPress={handleRemoveAvatar} disabled={avatarLoading}>
                <Text style={styles.avatarRemoveButtonText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {isEditing ? (
          <View style={styles.editPanel}>
            <TextInput
              style={styles.input}
              value={editDisplayName}
              onChangeText={setEditDisplayName}
              placeholder="Display Name"
              placeholderTextColor="#94A3B8"
              editable={!saveLoading}
            />
            <TextInput
              style={styles.input}
              value={editAge}
              onChangeText={setEditAge}
              placeholder="Age"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              editable={!saveLoading}
            />
            {!!saveError && <Text style={styles.errorText}>{saveError}</Text>}
            <View style={styles.editActionRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsEditing(false)} disabled={saveLoading}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile} disabled={saveLoading}>
                <Text style={styles.primaryButtonText}>{saveLoading ? 'Saving...' : 'Save Profile'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.name}>{user.displayName}</Text>
            <Text style={styles.username}>{user.email}</Text>
            <Text style={styles.bio}>Joined {new Date(user.joinedDate).toLocaleDateString()}</Text>
          </>
        )}
      </View>

      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RunCrew Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{formatDistanceKm(stats.weeklyDistanceKm)}</Text>
              <Text style={styles.statLabel}>Weekly {distanceUnitShort}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.monthlyCompletedActivities}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{formatDistanceKm(stats.monthlyDistanceKm)}</Text>
              <Text style={styles.statLabel}>Monthly {distanceUnitShort}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.level.name}</Text>
              <Text style={styles.statLabel}>{stats.level.progressPercent}% to next</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{user.averageRating > 0 ? user.averageRating.toFixed(1) : 'N/A'}</Text>
              <Text style={styles.statLabel}>Average rating</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Community</Text>
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('SocialConnections', { userId: user.id, initialTab: 'followers' })}
          >
            <Text style={styles.statNumber}>{user.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('SocialConnections', { userId: user.id, initialTab: 'following' })}
          >
            <Text style={styles.statNumber}>{user.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.totalRuns}</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatDistanceKm(user.totalDistance)}</Text>
            <Text style={styles.statLabel}>Total {distanceUnitShort}</Text>
          </View>
        </View>
      </View>

      {isOwnProfile && (
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('UserSearch')}>
          <Text style={styles.secondaryButtonText}>Search Users</Text>
        </TouchableOpacity>
      )}

      {isOwnProfile && !isEditing && (
        <TouchableOpacity style={styles.primaryButton} onPress={handleStartEdit}>
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}

      {isOwnProfile && (
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: brandColors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5F6FB',
    alignItems: 'center',
    backgroundColor: brandColors.paper,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#BFEAF5',
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D7EEF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#BFEAF5',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: brandColors.primaryDark,
  },
  avatarActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  avatarButton: {
    backgroundColor: '#E5F6FB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  avatarButtonText: {
    color: brandColors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  avatarRemoveButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  avatarRemoveButtonText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 12,
  },
  editPanel: {
    width: '100%',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: brandColors.textPrimary,
  },
  username: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: brandColors.textSecondary,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    color: brandColors.textPrimary,
  },
  errorText: {
    color: '#B91C1C',
    marginBottom: 10,
    fontWeight: '600',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: brandColors.textPrimary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: brandColors.paper,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5F6FB',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: brandColors.primaryDark,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: brandColors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF3B30',
    margin: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 4,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7EEF6',
  },
  secondaryButtonText: {
    color: brandColors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: brandColors.primaryDark,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserProfileScreen;
