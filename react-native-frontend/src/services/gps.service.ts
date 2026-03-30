import apiClient from '../utils/apiClient';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
}

export interface RouteData {
  id: string;
  activityId: string | null;
  userId: string;
  totalDistance: number;
  averageSpeed: number;
  duration: number;
  startTime: string;
  endTime: string;
  positionsS3Key?: string | null;
  createdAt: string;
  positions?: Array<{ latitude: number; longitude: number; timestamp: string }>;
  activity?: {
    id: string;
    title: string;
    scheduledDate: string;
    distance: number;
  };
}

export interface PerformanceMetrics {
  currentSpeed: number;
  distance: number;
  totalDistance: number;
  averageSpeed: number;
  duration: number;
  elapsedTime: number;
}

export interface CreateRouteData {
  activityId?: string | null;
  positions: GPSPosition[];
  startTime?: Date;
}

const normalizeMetrics = (data: Partial<PerformanceMetrics>): PerformanceMetrics => {
  const totalDistance = Number(data.totalDistance ?? data.distance ?? 0);
  const duration = Number(data.duration ?? data.elapsedTime ?? 0);

  return {
    currentSpeed: Number(data.currentSpeed ?? 0),
    distance: Number(data.distance ?? totalDistance),
    totalDistance,
    averageSpeed: Number(data.averageSpeed ?? 0),
    duration,
    elapsedTime: Number(data.elapsedTime ?? duration),
  };
};

export const gpsService = {
  async createRoute(data: CreateRouteData): Promise<RouteData> {
    const startTime = data.positions[0]?.timestamp ?? data.startTime;
    const createResponse = await apiClient.post<{ data: RouteData }>('/routes', {
      activityId: data.activityId ?? null,
      startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
    });

    const createdRoute = createResponse.data.data;
    if (data.positions.length < 2) {
      return createdRoute;
    }

    const positions = data.positions.map((position) => ({
      latitude: position.latitude,
      longitude: position.longitude,
      timestamp: position.timestamp instanceof Date ? position.timestamp.toISOString() : position.timestamp,
      accuracy: position.accuracy,
    }));

    const positionResponse = await apiClient.post<{ data: RouteData }>(`/routes/${createdRoute.id}/positions`, {
      positions,
    });

    return positionResponse.data.data;
  },

  async getRouteById(id: string): Promise<RouteData> {
    const response = await apiClient.get<{ data: RouteData }>(`/routes/${id}`);
    return response.data.data;
  },

  async getUserRoutes(userId: string, page = 1, limit = 10): Promise<RouteData[]> {
    const response = await apiClient.get<{ data: { routes: RouteData[] } }>(`/routes/user/${userId}`, {
      params: { page, limit },
    });
    return response.data.data.routes;
  },

  async getRouteMetrics(id: string): Promise<PerformanceMetrics> {
    const response = await apiClient.get<{ data: Partial<PerformanceMetrics> }>(`/routes/${id}/metrics`);
    return normalizeMetrics(response.data.data);
  },
};
