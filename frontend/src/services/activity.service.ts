import axios from 'axios';
import { Activity, ActivityFilters, CreateActivityData, UpdateActivityData } from '../types/activity.types';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

interface ActivityListResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
}

/** Backend returns latitude/longitude/address at top level; frontend expects location object */
type BackendActivity = Omit<Activity, 'location' | 'participants'> & {
  latitude: number;
  longitude: number;
  address: string;
  participants?: Activity['participants'];
};

function mapBackendActivity(a: BackendActivity): Activity {
  const { latitude, longitude, address, ...rest } = a;
  return {
    ...rest,
    location: { latitude, longitude, address },
    participants: a.participants ?? [],
  } as Activity;
}

export const activityService = {
  async getActivities(filters?: ActivityFilters, page = 1, limit = 20): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      if (filters.dateFrom) params.append('startDate', filters.dateFrom);
      if (filters.dateTo) params.append('endDate', filters.dateTo);
      if (filters.distanceMin !== undefined) params.append('minDistance', filters.distanceMin.toString());
      if (filters.distanceMax !== undefined) params.append('maxDistance', filters.distanceMax.toString());
      if (filters.latitude !== undefined) params.append('latitude', filters.latitude.toString());
      if (filters.longitude !== undefined) params.append('longitude', filters.longitude.toString());
      if (filters.radius !== undefined) params.append('radius', filters.radius.toString());
    }

    const response = await axios.get<{
      data: Activity[];
      pagination: { page: number; limit: number; total: number };
    }>(`${API_BASE_URL}/activities?${params.toString()}`, {
      headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
    });
    const { data, pagination } = response.data;
    const activities = (data as unknown as BackendActivity[]).map(mapBackendActivity);
    return { activities, total: pagination.total, page: pagination.page, limit: pagination.limit };
  },

  async getActivityById(id: string): Promise<Activity> {
    const response = await axios.get<{ data: BackendActivity }>(
      `${API_BASE_URL}/activities/${id}`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return mapBackendActivity(response.data.data);
  },

  async createActivity(data: CreateActivityData): Promise<Activity> {
    const body = {
      ...data,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      address: data.location.address,
    };
    const response = await axios.post<{ data: BackendActivity }>(
      `${API_BASE_URL}/activities`,
      body,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return mapBackendActivity(response.data.data);
  },

  async updateActivity(id: string, data: UpdateActivityData): Promise<Activity> {
    const body = data.location
      ? { ...data, latitude: data.location.latitude, longitude: data.location.longitude, address: data.location.address }
      : data;
    const response = await axios.put<{ data: BackendActivity }>(
      `${API_BASE_URL}/activities/${id}`,
      body,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return mapBackendActivity(response.data.data);
  },

  async deleteActivity(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/activities/${id}`,
      {
        headers: {
          Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
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
          Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
        },
      }
    );
  },

  async leaveActivity(id: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/activities/${id}/leave`,
      {
        headers: {
          Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
        },
      }
    );
  },

  async getFollowingActivities(page = 1, limit = 20): Promise<ActivityListResponse> {
    const response = await axios.get<{
      data: Activity[];
      pagination: { page: number; limit: number; total: number };
    }>(`${API_BASE_URL}/activities/feed?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
    });
    const { data, pagination } = response.data;
    const activities = (data as unknown as BackendActivity[]).map(mapBackendActivity);
    return { activities, total: pagination.total, page: pagination.page, limit: pagination.limit };
  },

  async createRating(activityId: string, data: { rating: number; feedback?: string }): Promise<void> {
    await axios.post(
      `${API_BASE_URL}/activities/${activityId}/ratings`,
      data,
      {
        headers: {
          Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
        },
      }
    );
  },

  async getActivityRatings(activityId: string): Promise<{ averageRating: number; totalRatings: number; ratings: any[] }> {
    const response = await axios.get<{
      data: { averageRating: number; totalRatings: number; ratings: any[] };
    }>(`${API_BASE_URL}/activities/${activityId}/ratings`, {
      headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
    });
    return response.data.data;
  },
};
