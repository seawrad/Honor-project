import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import RoutePreview from '../components/RoutePreview';
import { useAppSettings } from '../contexts/SettingsContext';
import { Activity, activityService } from '../services/activity.service';
import { gpsService } from '../services/gps.service';
import { memoryCardService } from '../services/memoryCard.service';
import { useGPSTracker } from '../hooks/useGPSTracker';
import { socketService } from '../services/socket.service';
import { tokenStorage } from '../utils/tokenStorage';
import { brandColors } from '../utils/brand';

type ParticipantLocation = {
  userId: string;
  displayName: string;
  isHost: boolean;
  latitude: number;
  longitude: number;
  avatarUrl?: string | null;
  speedKmh?: number;
  lastUpdate?: number;
};

const COUNTDOWN_SECONDS = 5;
const LOCATION_EMIT_INTERVAL_MS = 4000;

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

const GPSTrackingScreen = ({ navigation, route }: any) => {
  const { formatDistanceKm, formatSpeedKmh, distanceUnitShort, speedUnitShort } = useAppSettings();
  const activityId = route?.params?.activityId as string;
  const titleOverride = route?.params?.title as string | undefined;

  const {
    isTracking,
    isPaused,
    positions,
    currentPosition,
    metrics,
    error,
    startTracking,
    pauseTracking,
    stopTracking,
    clearPositions,
  } = useGPSTracker();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState<'ready' | 'countdown' | 'running'>('ready');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [participantLocations, setParticipantLocations] = useState<ParticipantLocation[]>([]);

  useEffect(() => {
    let active = true;
    const loadContext = async () => {
      try {
        const [nextActivity, user] = await Promise.all([
          activityService.getActivityById(activityId),
          tokenStorage.getUser(),
        ]);
        if (!active) {
          return;
        }
        setActivity(nextActivity);
        setCurrentUserId(user?.id ?? null);
      } catch (loadError: any) {
        if (active) {
          setMessage(loadError.response?.data?.error?.message || 'Unable to load tracking details.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadContext();
    return () => {
      active = false;
    };
  }, [activityId]);

  const isHost = currentUserId === activity?.creatorId;
  const isParticipant = useMemo(
    () => (activity?.participants ?? []).some((participant) => participant.userId === currentUserId),
    [activity?.participants, currentUserId]
  );
  const canAccess = Boolean(isHost || isParticipant);
  const canTrack = canAccess && activity?.status !== 'cancelled' && activity?.status !== 'completed';

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    let mounted = true;
    let unsubscribe: () => void = () => undefined;

    const setup = async () => {
      try {
        await socketService.connectAndWait();
        if (!mounted) {
          return;
        }
        socketService.joinActivityTracking(activityId);
        unsubscribe = socketService.onLocationReceived((payload) => {
          if (!mounted) {
            return;
          }

          setParticipantLocations((prev) => {
            const filtered = prev.filter((entry) => entry.userId !== payload.userId);
            return [...filtered, { ...payload, lastUpdate: Date.now() }];
          });
        });
      } catch {
        // Socket setup is best-effort; tracking can still work locally without it.
      }
    };

    setup();

    return () => {
      mounted = false;
      unsubscribe();
      socketService.leaveActivityTracking(activityId);
    };
  }, [activityId, canAccess]);

  useEffect(() => {
    if (!isTracking || !currentPosition) {
      return;
    }

    socketService.emitLocationUpdate(activityId, currentPosition.latitude, currentPosition.longitude, metrics.currentSpeed);
    const interval = setInterval(() => {
      socketService.emitLocationUpdate(activityId, currentPosition.latitude, currentPosition.longitude, metrics.currentSpeed);
    }, LOCATION_EMIT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [activityId, currentPosition, isTracking, metrics.currentSpeed]);

  useEffect(() => {
    if (phase !== 'countdown') {
      return;
    }

    if (countdown <= 0) {
      setPhase('running');
      startTracking();
      if (isHost) {
        activityService.updateActivityStatus(activityId, 'in-progress').catch(() => undefined);
      }
      return;
    }

    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [activityId, countdown, isHost, phase, startTracking]);

  const handleStart = useCallback(async (isResume?: boolean) => {
    if (isResume) {
      await startTracking(true);
      setPhase('running');
      return;
    }

    if (!isHost) {
      await startTracking();
      setPhase('running');
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);
    setPhase('countdown');
  }, [isHost, startTracking]);

  const handleStop = () => {
    stopTracking();
    setPhase('ready');
    if (isHost) {
      activityService.updateActivityStatus(activityId, 'completed').catch(() => undefined);
    }
  };

  const handleShareSummary = async () => {
    if (!activity) {
      return;
    }

    await Share.share({
      title: activity.title,
      message: `${activity.title} · ${formatDistanceKm(metrics.distance)} ${distanceUnitShort} · ${formatDuration(metrics.elapsedTime)} · ${(activity.currentParticipants ?? activity.participants?.length ?? 0)} participants`,
    });
  };

  const handleSaveRoute = async () => {
    if (positions.length < 2) {
      setMessage('At least two GPS points are required before saving a route.');
      return;
    }

    const participantCount = activity?.currentParticipants ?? activity?.participants?.length ?? 1;

    setSaving(true);
    setMessage('');
    try {
      const savedRoute = await gpsService.createRoute({
        activityId,
        positions,
        startTime: positions[0]?.timestamp,
      });

      Alert.alert('Route Saved', 'This activity route has been saved to your history.', [
        {
          text: 'Create Memory Card',
          onPress: async () => {
            setCreatingCard(true);
            try {
              const card = await memoryCardService.create({
                activityId,
                routeId: savedRoute.id,
                runDate: new Date(savedRoute.startTime || new Date().toISOString()).toISOString().slice(0, 10),
                participantCount,
                totalDistance: savedRoute.totalDistance ?? metrics.distance,
                averageSpeed: savedRoute.averageSpeed ?? metrics.averageSpeed,
                durationSeconds: savedRoute.duration ?? metrics.elapsedTime,
                routeSummary: { pointCount: positions.length },
              });
              clearPositions();
              navigation.navigate('MemoryCard', { cardId: card.id });
            } catch (cardError: any) {
              setMessage(cardError.response?.data?.error?.message || 'Unable to create a memory card right now.');
            } finally {
              setCreatingCard(false);
            }
          },
        },
        { text: 'Open Route History', onPress: () => { clearPositions(); navigation.navigate('RouteHistory'); } },
        { text: 'Close', style: 'cancel', onPress: () => clearPositions() },
      ]);
    } catch (saveError: any) {
      setMessage(saveError.response?.data?.error?.message || 'Unable to save the tracked route right now.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primaryDark} />
      </View>
    );
  }

  if (!activity || !canAccess) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Activity Tracking</Text>
        <Text style={styles.error}>{message || 'You need to be the host or a participant to access this tracking room.'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{titleOverride || activity.title}</Text>
      <Text style={styles.subtitle}>Live tracking for this activity. Hosts can start the session; everyone can share location and save their route.</Text>

      {phase === 'countdown' ? (
        <View style={styles.countdownCard}>
          <Text style={styles.countdownNumber}>{countdown > 0 ? countdown : 'Go'}</Text>
          <Text style={styles.countdownText}>{countdown > 0 ? 'Starting the activity soon.' : 'Tracking is starting now.'}</Text>
        </View>
      ) : null}

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!message ? <Text style={styles.error}>{message}</Text> : null}

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Activity Snapshot</Text>
        <Text style={styles.infoLine}>Status: {activity.status}</Text>
        <Text style={styles.infoLine}>Hosted by: {activity.creatorName}</Text>
        <Text style={styles.infoLine}>Participants: {activity.currentParticipants ?? activity.participants?.length ?? 0}</Text>
        <Text style={styles.infoLine}>Location: {activity.location.address}</Text>
      </View>

      {canTrack ? (
        <View style={styles.controlCard}>
          <Text style={styles.sectionTitle}>{isHost ? 'Tracking Controls' : 'Share Your Location'}</Text>
          <View style={styles.buttonRow}>
            {!isTracking && !isPaused ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleStart()}>
                <Text style={styles.primaryButtonText}>{isHost ? 'Start Activity Tracking' : 'Start Sharing'}</Text>
              </TouchableOpacity>
            ) : null}

            {isTracking ? (
              <>
                <TouchableOpacity style={styles.secondaryButton} onPress={pauseTracking}>
                  <Text style={styles.secondaryButtonText}>Pause</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerButton} onPress={handleStop}>
                  <Text style={styles.dangerButtonText}>Stop</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {isPaused ? (
              <>
                <TouchableOpacity style={styles.primaryButton} onPress={() => handleStart(true)}>
                  <Text style={styles.primaryButtonText}>Resume</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dangerButton} onPress={handleStop}>
                  <Text style={styles.dangerButtonText}>Stop</Text>
                </TouchableOpacity>
              </>
            ) : null}

            <TouchableOpacity style={[styles.secondaryButton, (isTracking || isPaused || saving || creatingCard || positions.length < 2) && styles.buttonDisabled]} onPress={handleSaveRoute} disabled={isTracking || isPaused || saving || creatingCard || positions.length < 2}>
              {saving ? <ActivityIndicator color={brandColors.primaryDark} /> : <Text style={styles.secondaryButtonText}>Save Route</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatDistanceKm(metrics.distance)} {distanceUnitShort}</Text>
          <Text style={styles.metricLabel}>Distance</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatSpeedKmh(metrics.currentSpeed)} {speedUnitShort}</Text>
          <Text style={styles.metricLabel}>Current Speed</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatSpeedKmh(metrics.averageSpeed)} {speedUnitShort}</Text>
          <Text style={styles.metricLabel}>Average Speed</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{formatDuration(metrics.elapsedTime)}</Text>
          <Text style={styles.metricLabel}>Elapsed Time</Text>
        </View>
      </View>

      <RoutePreview
        title="Live Route Preview"
        positions={positions}
        currentPosition={currentPosition}
        participantLocations={participantLocations}
        emptyLabel="Start or join tracking to see the route and participant markers."
      />

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Your Location</Text>
        {currentPosition ? (
          <>
            <Text style={styles.infoLine}>Latitude: {currentPosition.latitude.toFixed(5)}</Text>
            <Text style={styles.infoLine}>Longitude: {currentPosition.longitude.toFixed(5)}</Text>
            <Text style={styles.infoLine}>Accuracy: {Math.round(currentPosition.accuracy)} m</Text>
            <Text style={styles.infoLine}>Last update: {currentPosition.timestamp.toLocaleTimeString()}</Text>
          </>
        ) : (
          <Text style={styles.infoLine}>No live location captured yet.</Text>
        )}

        <TouchableOpacity style={styles.inlineActionButton} onPress={handleShareSummary}>
          <Text style={styles.inlineActionButtonText}>Share Activity Summary</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Participants Live</Text>
        {participantLocations.length === 0 ? (
          <Text style={styles.infoLine}>No live participant locations received yet.</Text>
        ) : (
          participantLocations.map((participant) => (
            <View key={participant.userId} style={styles.participantRow}>
              <View style={styles.participantHeader}>
                <Text style={styles.participantName}>{participant.isHost ? `Host · ${participant.displayName}` : participant.displayName}</Text>
                <Text style={styles.participantMeta}>{participant.speedKmh ? `${formatSpeedKmh(participant.speedKmh)} ${speedUnitShort}` : 'No pace yet'}</Text>
              </View>
              <Text style={styles.participantMeta}>
                {participant.latitude.toFixed(5)}, {participant.longitude.toFixed(5)}
              </Text>
            </View>
          ))
        )}
      </View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brandColors.textPrimary,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: brandColors.textSecondary,
    marginBottom: 16,
  },
  countdownCard: {
    backgroundColor: brandColors.primaryDark,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownNumber: {
    fontSize: 46,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 15,
    color: '#E0F7FA',
  },
  error: {
    color: brandColors.errorText,
    marginHorizontal: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5F6FB',
    marginBottom: 16,
  },
  controlCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5F6FB',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.textPrimary,
    marginBottom: 12,
  },
  infoLine: {
    fontSize: 14,
    color: brandColors.textPrimary,
    marginBottom: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: brandColors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: brandColors.textPrimary,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5F6FB',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: brandColors.primaryDark,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  participantRow: {
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '700',
    color: brandColors.textPrimary,
  },
  participantMeta: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
  inlineActionButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#E5F6FB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  inlineActionButtonText: {
    color: brandColors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
});

export default GPSTrackingScreen;