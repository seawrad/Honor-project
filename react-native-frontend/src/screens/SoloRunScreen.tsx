import React, { useEffect, useMemo, useState } from 'react';
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
import { gpsService } from '../services/gps.service';
import { memoryCardService } from '../services/memoryCard.service';
import { useGPSTracker } from '../hooks/useGPSTracker';
import { brandColors } from '../utils/brand';

const COUNTDOWN_SECONDS = 5;

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

const SoloRunScreen = ({ navigation }: any) => {
  const { formatDistanceKm, formatSpeedKmh, distanceUnitShort, speedUnitShort } = useAppSettings();
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

  const [phase, setPhase] = useState<'ready' | 'countdown' | 'running'>('ready');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [saving, setSaving] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [message, setMessage] = useState('');

  const helperText = useMemo(
    () => `Recorded points: ${positions.length}`,
    [positions.length]
  );

  useEffect(() => {
    if (phase !== 'countdown') {
      return;
    }

    if (countdown <= 0) {
      setPhase('running');
      startTracking();
      return;
    }

    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase, startTracking]);

  const handleStart = async (isResume?: boolean) => {
    if (isResume) {
      await startTracking(true);
      setPhase('running');
      return;
    }

    if (positions.length > 0) {
      Alert.alert('Start New Run', 'Starting a new run will clear the recorded points from the current one.', [
        { text: 'Keep Current Run', style: 'cancel' },
        {
          text: 'Start New Run',
          style: 'destructive',
          onPress: () => {
            clearPositions();
            setCountdown(COUNTDOWN_SECONDS);
            setPhase('countdown');
          },
        },
      ]);
      return;
    }

    setCountdown(COUNTDOWN_SECONDS);
    setPhase('countdown');
  };

  const handleEndRun = () => {
    stopTracking();
    setPhase('ready');
  };

  const handleShareSummary = async () => {
    await Share.share({
      title: 'RunCrew Solo Run',
      message: `Solo Run · ${formatDistanceKm(metrics.distance)} ${distanceUnitShort} · ${formatDuration(metrics.elapsedTime)} · ${positions.length} GPS points`,
    });
  };

  const handleSave = async () => {
    if (positions.length < 2) {
      setMessage('At least two GPS points are required before saving a route.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const savedRoute = await gpsService.createRoute({
        activityId: null,
        positions,
        startTime: positions[0]?.timestamp,
      });

      Alert.alert('Route Saved', 'Your solo run has been saved to route history.', [
        {
          text: 'Create Memory Card',
          onPress: async () => {
            setCreatingCard(true);
            try {
              const card = await memoryCardService.create({
                activityId: null,
                routeId: savedRoute.id,
                runDate: new Date(savedRoute.startTime || new Date().toISOString()).toISOString().slice(0, 10),
                participantCount: 1,
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
        {
          text: 'Open Route History',
          onPress: () => {
            clearPositions();
            navigation.navigate('RouteHistory');
          },
        },
        {
          text: 'Close',
          style: 'cancel',
          onPress: () => clearPositions(),
        },
      ]);
    } catch (saveError: any) {
      setMessage(saveError.response?.data?.error?.message || 'Unable to save the route right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Solo Run</Text>
      <Text style={styles.subtitle}>Track a personal run, pause when needed, then save it to route history.</Text>

      {phase === 'countdown' ? (
        <View style={styles.countdownCard}>
          <Text style={styles.countdownNumber}>{countdown > 0 ? countdown : 'Go'}</Text>
          <Text style={styles.countdownText}>{countdown > 0 ? 'Get ready to start moving.' : 'Starting tracking now.'}</Text>
        </View>
      ) : null}

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!message ? <Text style={styles.error}>{message}</Text> : null}

      <View style={styles.controlCard}>
        <Text style={styles.sectionTitle}>Run Controls</Text>
        <View style={styles.buttonRow}>
          {!isTracking && !isPaused ? (
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleStart()}>
              <Text style={styles.primaryButtonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : null}

          {isTracking ? (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={pauseTracking}>
                <Text style={styles.secondaryButtonText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={handleEndRun}>
                <Text style={styles.dangerButtonText}>End Run</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {isPaused ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={() => handleStart(true)}>
                <Text style={styles.primaryButtonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={handleEndRun}>
                <Text style={styles.dangerButtonText}>End Run</Text>
              </TouchableOpacity>
            </>
          ) : null}

          <TouchableOpacity style={[styles.secondaryButton, (isTracking || isPaused || saving || creatingCard || positions.length < 2) && styles.buttonDisabled]} onPress={handleSave} disabled={isTracking || isPaused || saving || creatingCard || positions.length < 2}>
            {saving ? <ActivityIndicator color={brandColors.primaryDark} /> : <Text style={styles.secondaryButtonText}>Save Route</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.helper}>{helperText}</Text>
      </View>

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
        emptyLabel="Start tracking to see your route build in real time."
      />

      <View style={styles.locationCard}>
        <Text style={styles.sectionTitle}>Live Position</Text>
        {currentPosition ? (
          <>
            <Text style={styles.locationLine}>Latitude: {currentPosition.latitude.toFixed(5)}</Text>
            <Text style={styles.locationLine}>Longitude: {currentPosition.longitude.toFixed(5)}</Text>
            <Text style={styles.locationLine}>Accuracy: {Math.round(currentPosition.accuracy)} m</Text>
            <Text style={styles.locationLine}>Last update: {currentPosition.timestamp.toLocaleTimeString()}</Text>
          </>
        ) : (
          <Text style={styles.locationLine}>No live position yet. Start tracking to begin.</Text>
        )}

        <TouchableOpacity style={styles.inlineActionButton} onPress={handleShareSummary}>
          <Text style={styles.inlineActionButtonText}>Share Run Summary</Text>
        </TouchableOpacity>
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
    marginBottom: 12,
    fontWeight: '600',
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
  helper: {
    marginTop: 12,
    color: brandColors.textSecondary,
    fontSize: 13,
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
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5F6FB',
  },
  locationLine: {
    fontSize: 14,
    color: brandColors.textPrimary,
    marginBottom: 6,
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

export default SoloRunScreen;