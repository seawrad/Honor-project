import axios from 'axios';
import { RouteData, CreateRouteData, PerformanceMetrics } from '../types/gps.types';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

export const gpsService = {
  async createRoute(data: CreateRouteData): Promise<RouteData> {
    const response = await axios.post<{ data: RouteData }>(
      `${API_BASE_URL}/routes`,
      data,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
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
