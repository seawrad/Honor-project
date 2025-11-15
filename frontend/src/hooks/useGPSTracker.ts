import { useState, useEffect, useCallback, useRef } from 'react';
import { GPSPosition, PerformanceMetrics } from '../types/gps.types';

interface UseGPSTrackerReturn {
  isTracking: boolean;
  positions: GPSPosition[];
  currentPosition: GPSPosition | null;
  metrics: PerformanceMetrics;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  clearPositions: () => void;
}

export const useGPSTracker = (): UseGPSTrackerReturn => {
  const [isTracking, setIsTracking] = useState(false);
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
  const startTracking = useCallback(async () => {
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    try {
      // Request permission first
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        setError('Location permission denied. Please enable location access.');
        return;
      }

      setIsTracking(true);
      startTimeRef.current = new Date();

      // Start watching position
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date(position.timestamp),
            accuracy: position.coords.accuracy,
          };

          setCurrentPosition(newPosition);
          setPositions((prev) => [...prev, newPosition]);
        },
        (error) => {
          console.error('GPS Error:', error);
          setError(`GPS Error: ${error.message}`);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
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

  // Stop GPS tracking
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
    positions,
    currentPosition,
    metrics,
    error,
    startTracking,
    stopTracking,
    clearPositions,
  };
};
