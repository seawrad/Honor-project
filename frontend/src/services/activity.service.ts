import axios from 'axios';
import { Activity, ActivityFilters, CreateActivityData, UpdateActivityData } from '../types/activity.types';
import { getAccessToken } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

interface ActivityListResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
}

export const activityService = {
  async getActivities(filters?: ActivityFilters, page = 1, limit = 20): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.distanceMin !== undefined) params.append('distanceMin', filters.distanceMin.toString());
      if (filters.distanceMax !== undefined) params.append('distanceMax', filters.distanceMax.toString());
      if (filters.latitude !== undefined) params.append('lat', filters.latitude.toString());
      if (filters.longitude !== undefined) params.append('lng', filters.longitude.toString());
      if (filters.radius !== undefined) params.append('radius', filters.radius.toString());
    }

    const response = await axios.get<ActivityListResponse>(
      `${API_BASE_URL}/activities?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },

  async getActivityById(id: string): Promise<Activity> {
    const response = await axios.get<Activity>(
      `${API_BASE_URL}/activities/${id}`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },

  async createActivity(data: CreateActivityData): Promise<Activity> {
    const response = await axios.post<Activity>(
      `${API_BASE_URL}/activities`,
      data,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },

  async updateActivity(id: string, data: UpdateActivityData): Promise<Activity> {
    const response = await axios.put<Activity>(
      `${API_BASE_URL}/activities/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },

  async deleteActivity(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/activities/${id}`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
  },

  async joinActivity(id: string): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/activities/${id}/join`,
      {},
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
  },

  async leaveActivity(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/activities/${id}/leave`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
  },

  async getFollowingActivities(page = 1, limit = 20): Promise<ActivityListResponse> {
    const response = await axios.get<ActivityListResponse>(
      `${API_BASE_URL}/activities/feed?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      }
    );
    return response.data;
  },
};
