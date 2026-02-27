import { useState, useEffect, useCallback, useRef } from 'react';
import { GPSPosition, PerformanceMetrics } from '../types/gps.types';

interface UseGPSTrackerReturn {
  isTracking: boolean;
  isPaused: boolean;
  positions: GPSPosition[];
  currentPosition: GPSPosition | null;
  metrics: PerformanceMetrics;
  error: string | null;
  startTracking: (isResume?: boolean) => Promise<void>;
  pauseTracking: () => void;
  stopTracking: () => void;
  clearPositions: () => void;
}

export const useGPSTracker = (): UseGPSTrackerReturn => {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [positions, setPositions] = useState<GPSPosition[]>([]);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    currentSpeed: 0,
    averageSpeed: 0,
    distance: 0,
    elapsedTime: 0,
  });
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const intervalIdRef = useRef<number | null>(null);

  // Calculate distance between two GPS positions using Haversine formula
  const calculateDistance = useCallback((pos1: GPSPosition, pos2: GPSPosition): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pos1.latitude * Math.PI / 180) *
      Math.cos(pos2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate total distance from positions array
  const calculateTotalDistance = useCallback((positions: GPSPosition[]): number => {
    if (positions.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < positions.length; i++) {
      totalDistance += calculateDistance(positions[i - 1], positions[i]);
    }
    return totalDistance;
  }, [calculateDistance]);

  // Update metrics
  const updateMetrics = useCallback(() => {
    if (!startTimeRef.current || positions.length === 0) return;

    const elapsedTime = (Date.now() - startTimeRef.current.getTime()) / 1000; // in seconds
    const totalDistance = calculateTotalDistance(positions);
    const averageSpeed = elapsedTime > 0 ? (totalDistance / elapsedTime) * 3600 : 0; // km/h

    let currentSpeed = 0;
    if (positions.length >= 2) {
      const lastTwo = positions.slice(-2);
      const distance = calculateDistance(lastTwo[0], lastTwo[1]);
      const timeDiff = (lastTwo[1].timestamp.getTime() - lastTwo[0].timestamp.getTime()) / 1000;
      currentSpeed = timeDiff > 0 ? (distance / timeDiff) * 3600 : 0; // km/h
    }

    setMetrics({
      currentSpeed,
      averageSpeed,
      distance: totalDistance,
      elapsedTime,
    });
  }, [positions, calculateTotalDistance, calculateDistance]);

  // Start GPS tracking
  const startTracking = useCallback(async (isResume = false) => {
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    try {
      // Request permission first (skip on resume). Permissions API not supported in Firefox/Safari.
      if (!isResume) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            setError('Location permission denied. Please enable location access.');
            return;
          }
        } catch {
          // Permissions API not supported - proceed anyway, watchPosition will prompt
        }
      }

      setIsTracking(true);
      setIsPaused(false);
      if (!isResume) startTimeRef.current = new Date();

      // Start watching position. Use relaxed options for better compatibility.
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(position.timestamp),
            accuracy: position.coords.accuracy ?? 0,
          };

          setCurrentPosition(newPosition);
          setPositions((prev) => [...prev, newPosition]);
        },
        (err) => {
          console.error('GPS Error:', err);
          const msg = err.code === 1 ? 'Location permission denied. Please enable location access.'
            : err.code === 2 ? 'Location unavailable. Please check your device.'
            : err.code === 3 ? 'Location request timed out. Please try again.'
            : `GPS Error: ${err.message}`;
          setError(msg);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        }
      );

      // Update metrics every second
      intervalIdRef.current = window.setInterval(() => {
        updateMetrics();
      }, 1000);
    } catch (err) {
      setError('Failed to start GPS tracking');
      console.error(err);
    }
  }, [updateMetrics]);

  // Pause GPS tracking (keeps positions, can resume)
  const pauseTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsTracking(false);
    setIsPaused(true);
  }, []);

  // Stop GPS tracking (full stop)
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsTracking(false);
    setIsPaused(false);
  }, []);

  // Clear positions
  const clearPositions = useCallback(() => {
    setPositions([]);
    setCurrentPosition(null);
    setMetrics({
      currentSpeed: 0,
      averageSpeed: 0,
      distance: 0,
      elapsedTime: 0,
    });
    startTimeRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

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
