import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';

import { brandColors } from '../utils/brand';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type ParticipantMarker = Coordinate & {
  userId: string;
  displayName: string;
  isHost?: boolean;
  speedKmh?: number;
};

type RoutePreviewProps = {
  positions?: Coordinate[];
  currentPosition?: Coordinate | null;
  participantLocations?: ParticipantMarker[];
  title?: string;
  emptyLabel?: string;
};

const VIEWBOX_WIDTH = 320;
const VIEWBOX_HEIGHT = 220;
const PADDING = 18;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatSpeed = (speedKmh?: number) => {
  if (typeof speedKmh !== 'number' || Number.isNaN(speedKmh) || speedKmh <= 0) {
    return 'No pace yet';
  }

  return `${speedKmh.toFixed(1)} km/h`;
};

const toDisplayPoints = (points: Coordinate[]) => {
  if (points.length === 0) {
    return [] as Array<{ x: number; y: number }>;
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.0001);
  const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.0001);
  const drawableWidth = VIEWBOX_WIDTH - PADDING * 2;
  const drawableHeight = VIEWBOX_HEIGHT - PADDING * 2;

  return points.map((point) => ({
    x: clamp(PADDING + ((point.longitude - minLongitude) / longitudeSpan) * drawableWidth, PADDING, VIEWBOX_WIDTH - PADDING),
    y: clamp(VIEWBOX_HEIGHT - PADDING - ((point.latitude - minLatitude) / latitudeSpan) * drawableHeight, PADDING, VIEWBOX_HEIGHT - PADDING),
  }));
};

const RoutePreview = ({
  positions = [],
  currentPosition,
  participantLocations = [],
  title = 'Route Preview',
  emptyLabel = 'Start tracking to draw your route.',
}: RoutePreviewProps) => {
  const allPoints = useMemo(() => {
    const nextPoints = [...positions];
    if (currentPosition) {
      nextPoints.push(currentPosition);
    }

    participantLocations.forEach((participant) => {
      nextPoints.push({ latitude: participant.latitude, longitude: participant.longitude });
    });

    return nextPoints;
  }, [currentPosition, participantLocations, positions]);

  const displayPoints = useMemo(() => toDisplayPoints(allPoints), [allPoints]);
  const routeDisplayPoints = displayPoints.slice(0, positions.length);
  const currentDisplayPoint = currentPosition ? displayPoints[positions.length] : null;
  const participantDisplayPoints = displayPoints.slice(
    positions.length + (currentPosition ? 1 : 0),
    positions.length + (currentPosition ? 1 : 0) + participantLocations.length
  );

  const polylinePoints = routeDisplayPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const startPoint = routeDisplayPoints[0];
  const endPoint = routeDisplayPoints[routeDisplayPoints.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{positions.length} pts</Text>
      </View>

      {allPoints.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{emptyLabel}</Text>
        </View>
      ) : (
        <View style={styles.canvasWrap}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
            <Rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} rx="18" fill="#F4FBFE" />
            <Line x1={PADDING} y1={VIEWBOX_HEIGHT - PADDING} x2={VIEWBOX_WIDTH - PADDING} y2={VIEWBOX_HEIGHT - PADDING} stroke="#D7EEF6" strokeWidth="1" />
            <Line x1={PADDING} y1={PADDING} x2={PADDING} y2={VIEWBOX_HEIGHT - PADDING} stroke="#D7EEF6" strokeWidth="1" />

            {routeDisplayPoints.length > 1 ? (
              <Polyline points={polylinePoints} fill="none" stroke={brandColors.primaryDark} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            ) : null}

            {startPoint ? <Circle cx={startPoint.x} cy={startPoint.y} r="6" fill="#10B981" /> : null}
            {endPoint ? <Circle cx={endPoint.x} cy={endPoint.y} r="6" fill="#EF4444" /> : null}
            {currentDisplayPoint ? <Circle cx={currentDisplayPoint.x} cy={currentDisplayPoint.y} r="7" fill={brandColors.warning} stroke="#FFFFFF" strokeWidth="2" /> : null}

            {participantDisplayPoints.map((point, index) => (
              <Circle
                key={participantLocations[index]?.userId || index}
                cx={point.x}
                cy={point.y}
                r={participantLocations[index]?.isHost ? '7' : '5'}
                fill={participantLocations[index]?.isHost ? '#F59E0B' : '#2563EB'}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            ))}
          </Svg>
        </View>
      )}

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Start</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Finish</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: brandColors.warning }]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
          <Text style={styles.legendText}>Others</Text>
        </View>
      </View>

      {participantLocations.length > 0 ? (
        <View style={styles.participantList}>
          {participantLocations.map((participant) => (
            <View key={participant.userId} style={styles.participantRow}>
              <Text style={styles.participantName}>
                {participant.isHost ? 'Host' : 'Runner'} · {participant.displayName}
              </Text>
              <Text style={styles.participantMeta}>{formatSpeed(participant.speedKmh)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5F6FB',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: brandColors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: brandColors.textSecondary,
    fontWeight: '600',
  },
  canvasWrap: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  emptyState: {
    height: 220,
    borderRadius: 18,
    backgroundColor: '#F4FBFE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: brandColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: brandColors.textSecondary,
    fontWeight: '600',
  },
  participantList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantName: {
    fontSize: 13,
    fontWeight: '600',
    color: brandColors.textPrimary,
  },
  participantMeta: {
    fontSize: 12,
    color: brandColors.textSecondary,
  },
});

export default RoutePreview;