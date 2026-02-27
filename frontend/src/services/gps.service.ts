import axios from 'axios';
import { RouteData, CreateRouteData, PerformanceMetrics } from '../types/gps.types';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

export const gpsService = {
  async createRoute(data: CreateRouteData): Promise<RouteData> {
    const { positions, activityId, startTime } = data;
    const createPayload = {
      activityId: activityId ?? null,
      startTime: positions[0]?.timestamp ?? startTime,
    };
    const createRes = await axios.post<{ data: RouteData }>(
      `${API_BASE_URL}/routes`,
      createPayload,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    const route = createRes.data.data;
    if (positions.length >= 2) {
      const posRes = await axios.post<{ data: RouteData }>(
        `${API_BASE_URL}/routes/${route.id}/positions`,
        { positions },
        { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
      );
      return { ...posRes.data.data, activityId: route.activityId };
    }
    return { ...route, ...data };
  },

  async getRouteById(id: string): Promise<RouteData> {
    const response = await axios.get<{ data: RouteData }>(
      `${API_BASE_URL}/routes/${id}`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },

  async getUserRoutes(userId: string, page = 1, limit = 10): Promise<RouteData[]> {
    const response = await axios.get<{ data: { routes: RouteData[] } }>(
      `${API_BASE_URL}/routes/user/${userId}`,
      { params: { page, limit }, headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data.routes;
  },

  async getRouteMetrics(id: string): Promise<PerformanceMetrics> {
    const response = await axios.get<{ data: PerformanceMetrics }>(
      `${API_BASE_URL}/routes/${id}/metrics`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },
};
