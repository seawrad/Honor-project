import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { GPSPosition, PerformanceMetrics } from '../services/gps.service';

const defaultMetrics: PerformanceMetrics = {
  currentSpeed: 0,
  distance: 0,
  totalDistance: 0,
  averageSpeed: 0,
  duration: 0,
  elapsedTime: 0,
};

const haversineDistanceKm = (from: GPSPosition, to: GPSPosition) => {
  const radius = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getTotalDistance = (positions: GPSPosition[]) => {
  if (positions.length < 2) {
    return 0;
  }

  return positions.slice(1).reduce((total, position, index) => {
    return total + haversineDistanceKm(positions[index], position);
  }, 0);
};

export const useGPSTracker = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [positions, setPositions] = useState<GPSPosition[]>([]);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>(defaultMetrics);
  const [error, setError] = useState<string | null>(null);

  const positionSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const metricIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const positionsRef = useRef<GPSPosition[]>([]);

  positionsRef.current = positions;

  const stopWatchers = useCallback(() => {
    positionSubscriptionRef.current?.remove();
    positionSubscriptionRef.current = null;

    if (metricIntervalRef.current) {
      clearInterval(metricIntervalRef.current);
      metricIntervalRef.current = null;
    }
  }, []);

  const updateMetrics = useCallback(() => {
    if (!startTimeRef.current) {
      return;
    }

    const elapsedTime = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const totalDistance = getTotalDistance(positionsRef.current);
    const averageSpeed = elapsedTime > 0 ? (totalDistance / elapsedTime) * 3600 : 0;

    let currentSpeed = 0;
    const lastPosition = positionsRef.current[positionsRef.current.length - 1];
    const previousPosition = positionsRef.current[positionsRef.current.length - 2];
    if (lastPosition && previousPosition) {
      const segmentDistance = haversineDistanceKm(previousPosition, lastPosition);
      const secondsBetween = (lastPosition.timestamp.getTime() - previousPosition.timestamp.getTime()) / 1000;
      currentSpeed = secondsBetween > 0 ? (segmentDistance / secondsBetween) * 3600 : 0;
    }

    setMetrics({
      currentSpeed,
      distance: totalDistance,
      totalDistance,
      averageSpeed,
      duration: elapsedTime,
      elapsedTime,
    });
  }, []);

  const startMetricTimer = useCallback(() => {
    if (metricIntervalRef.current) {
      clearInterval(metricIntervalRef.current);
    }

    metricIntervalRef.current = setInterval(updateMetrics, 1000);
  }, [updateMetrics]);

  const startTracking = useCallback(async (isResume = false) => {
    setError(null);

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setError('Location permission denied. Please enable location access.');
      return;
    }

    if (!isResume) {
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else if (startTimeRef.current) {
      startTimeRef.current = Date.now() - elapsedBeforePauseRef.current * 1000;
    }

    setIsTracking(true);
    setIsPaused(false);

    positionSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 3000,
        distanceInterval: 3,
      },
      (location) => {
        const nextPosition: GPSPosition = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date(location.timestamp ?? Date.now()),
          accuracy: location.coords.accuracy ?? 0,
        };

        setCurrentPosition(nextPosition);
        setPositions((prev) => [...prev, nextPosition]);
      }
    );

    startMetricTimer();
  }, [startMetricTimer]);

  const pauseTracking = useCallback(() => {
    stopWatchers();
    elapsedBeforePauseRef.current = metrics.elapsedTime;
    setIsTracking(false);
    setIsPaused(true);
  }, [metrics.elapsedTime, stopWatchers]);

  const stopTracking = useCallback(() => {
    stopWatchers();
    elapsedBeforePauseRef.current = metrics.elapsedTime;
    setIsTracking(false);
    setIsPaused(false);
  }, [metrics.elapsedTime, stopWatchers]);

  const clearPositions = useCallback(() => {
    stopWatchers();
    startTimeRef.current = null;
    elapsedBeforePauseRef.current = 0;
    setPositions([]);
    setCurrentPosition(null);
    setMetrics(defaultMetrics);
    setIsTracking(false);
    setIsPaused(false);
    setError(null);
  }, [stopWatchers]);

  useEffect(() => {
    return () => {
      stopWatchers();
    };
  }, [stopWatchers]);

  return {
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
  };
};