import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppSettings } from '../contexts/SettingsContext';
import { activityService } from '../services/activity.service';
import { memoryCardService, RunMemoryCard } from '../services/memoryCard.service';
import { brandColors } from '../utils/brand';

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

const MemoryCardScreen = ({ navigation, route }: any) => {
  const { formatDistanceKm, formatSpeedKmh, distanceUnitShort, speedUnitShort } = useAppSettings();
  const cardId = route?.params?.cardId as string;
  const [card, setCard] = useState<RunMemoryCard | null>(null);
  const [activityTitle, setActivityTitle] = useState('Solo Run');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadCard = async () => {
      try {
        const nextCard = await memoryCardService.getById(cardId);
        if (!active) {
          return;
        }

        setCard(nextCard);
        if (nextCard.activityId) {
          const activity = await activityService.getActivityById(nextCard.activityId).catch(() => null);
          if (active && activity?.title) {
            setActivityTitle(activity.title);
          }
        }
      } catch (loadError: any) {
        if (active) {
          setError(loadError.response?.data?.error?.message || 'Unable to load memory card.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCard();
    return () => {
      active = false;
    };
  }, [cardId]);

  const shareText = useMemo(() => {
    if (!card) {
      return '';
    }
    return `RunCrew Memory Card: ${activityTitle} · ${formatDistanceKm(Number(card.totalDistance || 0), 1)} ${distanceUnitShort} · ${formatDuration(card.durationSeconds)}`;
  }, [activityTitle, card, distanceUnitShort, formatDistanceKm]);

  const handleShare = async () => {
    if (!card) {
      return;
    }

    await Share.share({
      title: 'RunCrew Memory Card',
      message: shareText,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brandColors.primaryDark} />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Run Memory Card</Text>
        <Text style={styles.error}>{error || 'Memory card not found.'}</Text>
      </View>
    );
  }

  const imageUrl = card.aiImageUrl || card.groupPhotoUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Run Memory Card</Text>
          <Text style={styles.subtitle}>{activityTitle}</Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardShell}>
        <View style={styles.heroPanel}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroFallback}>
              <Text style={styles.heroFallbackTitle}>{card.participantCount} runners</Text>
              <Text style={styles.heroFallbackText}>{formatDistanceKm(Number(card.totalDistance || 0))} {distanceUnitShort} together</Text>
            </View>
          )}
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.dateText}>{new Date(card.runDate).toLocaleDateString()}</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricChip}>
              <Text style={styles.metricValue}>{formatDistanceKm(Number(card.totalDistance || 0))} {distanceUnitShort}</Text>
              <Text style={styles.metricLabel}>Distance</Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricValue}>{formatSpeedKmh(Number(card.averageSpeed || 0))} {speedUnitShort}</Text>
              <Text style={styles.metricLabel}>Avg Speed</Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricValue}>{formatDuration(card.durationSeconds)}</Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>
            <View style={styles.metricChip}>
              <Text style={styles.metricValue}>{card.participantCount}</Text>
              <Text style={styles.metricLabel}>Participants</Text>
            </View>
          </View>

          {card.weatherDesc || card.weatherTemp !== undefined ? (
            <View style={styles.infoBlock}>
              <Text style={styles.blockTitle}>Weather</Text>
              <Text style={styles.blockText}>
                {card.weatherDesc || 'Conditions recorded'}
                {card.weatherTemp !== undefined ? ` · ${card.weatherTemp}°C` : ''}
              </Text>
            </View>
          ) : null}

          {card.newsHeadline ? (
            <View style={styles.infoBlock}>
              <Text style={styles.blockTitle}>News Headline</Text>
              <Text style={styles.blockText}>{card.newsHeadline}</Text>
            </View>
          ) : null}

          {card.messages?.length ? (
            <View style={styles.infoBlock}>
              <Text style={styles.blockTitle}>Messages</Text>
              {card.messages.slice(0, 4).map((message, index) => (
                <Text key={`${message.userId}-${index}`} style={styles.messageLine}>
                  {message.displayName}: {message.content}
                </Text>
              ))}
            </View>
          ) : null}

          {card.routeSummary?.pointCount ? (
            <View style={styles.infoBlock}>
              <Text style={styles.blockTitle}>Route Summary</Text>
              <Text style={styles.blockText}>{card.routeSummary.pointCount} GPS points recorded</Text>
            </View>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (card.activityId) {
            navigation.navigate('ActivityDetail', { id: card.activityId });
            return;
          }
          navigation.navigate('RouteHistory');
        }}
      >
        <Text style={styles.backButtonText}>{card.activityId ? 'Back To Activity' : 'Back To Route History'}</Text>
      </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: brandColors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: brandColors.textSecondary,
  },
  error: {
    marginTop: 12,
    color: brandColors.errorText,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: brandColors.primaryDark,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardShell: {
    backgroundColor: '#102A63',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroPanel: {
    height: 210,
    backgroundColor: '#183B8C',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroFallbackTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroFallbackText: {
    fontSize: 16,
    color: '#D7ECFF',
  },
  infoPanel: {
    padding: 18,
  },
  dateText: {
    color: '#D7ECFF',
    fontSize: 14,
    marginBottom: 14,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  metricChip: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#D7ECFF',
  },
  infoBlock: {
    marginBottom: 14,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A9D3FF',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  blockText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  messageLine: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: brandColors.textPrimary,
    fontWeight: '700',
  },
});

export default MemoryCardScreen;