import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { activityService, Activity, ActivityRatingSummary } from '../services/activity.service';
import { useAppSettings } from '../contexts/SettingsContext';
import { tokenStorage } from '../utils/tokenStorage';
import { brandColors } from '../utils/brand';

const ActivityDetailScreen = ({ route, navigation }: any) => {
  const { formatDistanceKm, distanceUnitShort } = useAppSettings();
  const { id } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<ActivityRatingSummary | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showRatingComposer, setShowRatingComposer] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [id]);

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

    const loadExtras = async () => {
      try {
        const [bookmarkedIds, ratingSummary] = await Promise.all([
          activityService.getBookmarkedIds().catch(() => [] as string[]),
          activityService.getActivityRatings(id).catch(() => null),
        ]);

        if (!active) {
          return;
        }

        setIsBookmarked(bookmarkedIds.includes(id));
        setRatings(ratingSummary);
        setHasRated(Boolean(ratingSummary?.ratings.some((entry) => entry.userId === currentUserId)));
      } catch {
        if (active) {
          setRatings(null);
        }
      }
    };

    loadExtras();

    return () => {
      active = false;
    };
  }, [currentUserId, id]);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const data = await activityService.getActivityById(id);
      setActivity(data);
    } catch (error) {
      console.error('Failed to load activity', error);
      Alert.alert('Error', 'Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinActivity = async () => {
    setActionLoading(true);
    try {
      await activityService.joinActivity(id);
      Alert.alert('Success', 'You joined the activity');
      loadActivity();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to join activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveActivity = async () => {
    setActionLoading(true);
    try {
      await activityService.leaveActivity(id);
      Alert.alert('Success', 'You left the activity');
      loadActivity();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Failed to leave activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await activityService.unbookmarkActivity(id);
        setIsBookmarked(false);
      } else {
        await activityService.bookmarkActivity(id);
        setIsBookmarked(true);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Unable to update bookmark right now.');
    }
  };

  const handleSubmitRating = async () => {
    setRatingSubmitting(true);
    try {
      await activityService.createRating(id, {
        rating: selectedRating,
        feedback: ratingFeedback.trim() || undefined,
      });
      const nextRatings = await activityService.getActivityRatings(id);
      setRatings(nextRatings);
      setHasRated(true);
      setShowRatingComposer(false);
      setRatingFeedback('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error?.message || 'Unable to submit rating right now.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.centered}>
        <Text>Activity not found</Text>
      </View>
    );
  }

  const isCreator = currentUserId === activity.creatorId;
  const isParticipant = (activity.participants ?? []).some((participant) => participant.userId === currentUserId);
  const isFull = (activity.currentParticipants ?? activity.participants?.length ?? 0) >= (activity.maxParticipants ?? Number.MAX_SAFE_INTEGER);
  const canEdit = isCreator && new Date(activity.scheduledDate).getTime() - Date.now() > 60 * 60 * 1000;

  const canOpenChat = isCreator || isParticipant;
  const canTrackActivity = (isCreator || isParticipant) && (activity.status === 'upcoming' || activity.status === 'in-progress');
  const showJoinAction = !isCreator && activity.status === 'upcoming' && !isParticipant;
  const showLeaveAction = !isCreator && activity.status === 'upcoming' && isParticipant;
  const participantCount = activity.currentParticipants ?? activity.participants?.length ?? 0;
  const statusStyle = [styles.badge, activity.status === 'cancelled' ? styles.badgeCancelled : activity.status === 'completed' ? styles.badgeCompleted : activity.status === 'in-progress' ? styles.badgeInProgress : styles.badgeUpcoming];
  const canRate = activity.status === 'completed' && isParticipant && !hasRated;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>{activity.title}</Text>
          <TouchableOpacity style={[styles.bookmarkButton, isBookmarked && styles.bookmarkButtonActive]} onPress={handleBookmarkToggle}>
            <Text style={[styles.bookmarkButtonText, isBookmarked && styles.bookmarkButtonTextActive]}>{isBookmarked ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={statusStyle}>{activity.status.toUpperCase()}</Text>
        <Text style={styles.creatorMeta}>Hosted by {activity.creatorName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Type: </Text>
          {activity.activityType}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.label}>Date: </Text>
          {new Date(activity.scheduledDate).toLocaleString()}
        </Text>
        {activity.distance && (
          <Text style={styles.text}>
            <Text style={styles.label}>Distance: </Text>
            {formatDistanceKm(activity.distance)} {distanceUnitShort}
          </Text>
        )}
        {activity.durationMinutes && (
          <Text style={styles.text}>
            <Text style={styles.label}>Duration: </Text>
            {activity.durationMinutes} minutes
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.text}>{activity.location.address}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.text}>{activity.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Participants</Text>
        <Text style={styles.text}>
          {participantCount} / {activity.maxParticipants || '∞'}
        </Text>
        {(activity.participants ?? []).map((participant) => (
          <View key={participant.userId} style={styles.participantRow}>
            <Text style={styles.participantName}>{participant.displayName}</Text>
            <Text style={styles.participantMeta}>Joined {new Date(participant.joinedAt).toLocaleDateString()}</Text>
          </View>
        ))}
      </View>

      {canEdit ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.secondaryActionButton, styles.halfWidth]} onPress={() => navigation.navigate('EditActivity', { id })}>
            <Text style={styles.secondaryButtonText}>Edit Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dangerButton, styles.halfWidth]} onPress={() => navigation.navigate('CancelActivity', { id })}>
            <Text style={styles.dangerButtonText}>Cancel Activity</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showJoinAction ? (
        <TouchableOpacity
          style={[styles.button, (actionLoading || isFull) && styles.buttonDisabled]}
          onPress={handleJoinActivity}
          disabled={actionLoading || isFull}
        >
          <Text style={styles.buttonText}>{actionLoading ? 'Joining...' : isFull ? 'Activity Full' : 'Join Activity'}</Text>
        </TouchableOpacity>
      ) : null}

      {showLeaveAction ? (
        <TouchableOpacity
          style={[styles.leaveButton, actionLoading && styles.buttonDisabled]}
          onPress={handleLeaveActivity}
          disabled={actionLoading}
        >
          <Text style={styles.leaveButtonText}>{actionLoading ? 'Leaving...' : 'Leave Activity'}</Text>
        </TouchableOpacity>
      ) : null}

      {canOpenChat ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            navigation.navigate('ChatRoom', {
              mode: 'activity',
              activityId: id,
              title: activity.title,
            })
          }
        >
          <Text style={styles.secondaryButtonText}>Open Chat</Text>
        </TouchableOpacity>
      ) : null}

      {canTrackActivity ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            navigation.navigate('GPSTracking', {
              activityId: id,
              title: activity.title,
            })
          }
        >
          <Text style={styles.secondaryButtonText}>{isCreator ? 'Start Tracking' : 'Open Tracking'}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Ratings</Text>
        {ratings && ratings.totalRatings > 0 ? (
          <>
            <Text style={styles.text}>Average: {ratings.averageRating.toFixed(1)} / 5</Text>
            <Text style={styles.text}>Ratings: {ratings.totalRatings}</Text>
            {ratings.ratings.slice(0, 4).map((entry) => (
              <View key={entry.id} style={styles.ratingRow}>
                <Text style={styles.participantName}>{entry.userName} · {entry.rating}/5</Text>
                {entry.feedback ? <Text style={styles.participantMeta}>{entry.feedback}</Text> : null}
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.text}>No ratings yet.</Text>
        )}

        {canRate ? (
          <>
            {!showRatingComposer ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowRatingComposer(true)}>
                <Text style={styles.secondaryButtonText}>Rate Activity</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.ratingComposer}>
                <Text style={styles.label}>Your Rating</Text>
                <View style={styles.ratingPickerRow}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[styles.ratingChip, selectedRating === value && styles.ratingChipActive]}
                      onPress={() => setSelectedRating(value)}
                    >
                      <Text style={[styles.ratingChipText, selectedRating === value && styles.ratingChipTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Optional feedback"
                  placeholderTextColor="#94A3B8"
                  value={ratingFeedback}
                  onChangeText={setRatingFeedback}
                  multiline
                />
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.secondaryActionButton, styles.halfWidth]} onPress={() => setShowRatingComposer(false)} disabled={ratingSubmitting}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.halfWidth]} onPress={handleSubmitRating} disabled={ratingSubmitting}>
                    <Text style={styles.buttonText}>{ratingSubmitting ? 'Submitting...' : 'Submit Rating'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : null}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5F6FB',
    backgroundColor: '#FFFFFF',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    color: brandColors.textPrimary,
    flex: 1,
  },
  bookmarkButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D7EEF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  bookmarkButtonActive: {
    backgroundColor: '#E5F6FB',
    borderColor: '#7DD3FC',
  },
  bookmarkButtonText: {
    color: brandColors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  bookmarkButtonTextActive: {
    color: brandColors.primaryDark,
  },
  badge: {
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  badgeUpcoming: {
    backgroundColor: '#0EA5E9',
  },
  badgeInProgress: {
    backgroundColor: '#10B981',
  },
  badgeCompleted: {
    backgroundColor: '#64748B',
  },
  badgeCancelled: {
    backgroundColor: '#DC2626',
  },
  creatorMeta: {
    marginTop: 10,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5F6FB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: brandColors.textPrimary,
  },
  text: {
    fontSize: 14,
    color: brandColors.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  label: {
    fontWeight: 'bold',
    color: brandColors.textPrimary,
  },
  participantRow: {
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 4,
  },
  participantMeta: {
    fontSize: 12,
    color: brandColors.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 15,
    marginTop: 15,
  },
  button: {
    backgroundColor: brandColors.primaryDark,
    margin: 15,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  halfWidth: {
    flex: 1,
  },
  dangerButton: {
    backgroundColor: '#DC2626',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaveButton: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginTop: 6,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#E5F6FB',
    marginHorizontal: 15,
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0A2640',
    fontSize: 15,
    fontWeight: '700',
  },
  ratingRow: {
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ratingComposer: {
    marginTop: 12,
  },
  ratingPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  ratingChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFEAF5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  ratingChipActive: {
    backgroundColor: brandColors.primaryDark,
    borderColor: brandColors.primaryDark,
  },
  ratingChipText: {
    color: brandColors.primaryDark,
    fontWeight: '700',
  },
  ratingChipTextActive: {
    color: '#FFFFFF',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    color: brandColors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
});

export default ActivityDetailScreen;
