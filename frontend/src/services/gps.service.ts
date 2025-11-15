import axios from 'axios';
import { RouteData, CreateRouteData, PerformanceMetrics } from '../types/gps.types';
import { getAccessToken } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

export const gpsService = {
  async createRoute(data: CreateRouteData): Promise<RouteData> {
    const response = await axios.post<RouteData>(
      `${API_BASE_URL}/routes`,
      data,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },

  async getRouteById(id: string): Promise<RouteData> {
    const response = await axios.get<RouteData>(
      `${API_BASE_URL}/routes/${id}`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },

  async getUserRoutes(userId: string): Promise<RouteData[]> {
    const response = await axios.get<RouteData[]>(
      `${API_BASE_URL}/routes/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },

  async getRouteMetrics(id: string): Promise<PerformanceMetrics> {
    const response = await axios.get<PerformanceMetrics>(
      `${API_BASE_URL}/routes/${id}/metrics`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },
};
