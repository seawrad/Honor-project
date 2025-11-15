export interface GPSPosition {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
}

export interface RouteData {
  id: string;
  activityId: string;
  userId: string;
  positions: GPSPosition[];
  totalDistance: number;
  averageSpeed: number;
  duration: number; // in seconds
  startTime: Date;
  endTime: Date;
}

export interface PerformanceMetrics {
  currentSpeed: number;
  averageSpeed: number;
  distance: number;
  elapsedTime: number;
}

export interface CreateRouteData {
  activityId: string;
  positions: GPSPosition[];
  totalDistance: number;
  averageSpeed: number;
  duration: number;
  startTime: Date;
  endTime: Date;
}
