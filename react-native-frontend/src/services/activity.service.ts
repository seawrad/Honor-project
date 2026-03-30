import apiClient from '../utils/apiClient';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Activity {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  scheduledDate: string;
  location: Location;
  endLocation?: Location;
  distance?: number;
  route?: string;
  participants?: Participant[];
  maxParticipants?: number;
  currentParticipants?: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  activityType?: 'time-based' | 'route-based';
  durationMinutes?: number;
  pace?: number;
  elevation?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  userId: string;
  displayName: string;
  joinedAt: string;
}

export interface ActivityRating {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  rating: number;
  feedback?: string;
  createdAt: string;
}

export interface ActivityRatingSummary {
  averageRating: number;
  totalRatings: number;
  ratings: ActivityRating[];
}

export interface ActivityFilters {
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  distanceMin?: number;
  distanceMax?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  status?: string;
  activityType?: string;
}

export interface CreateActivityData {
  title: string;
  description: string;
  scheduledDate: string;
  location: Location;
  endLocation?: Location;
  distance?: number;
  route?: string;
  maxParticipants?: number;
  activityType?: 'route-based' | 'time-based';
  durationMinutes?: number;
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  scheduledDate?: string;
  location?: Location;
  route?: string;
  distance?: number;
  maxParticipants?: number;
  durationMinutes?: number;
}

interface ActivityListResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
}

type BackendActivity = Omit<Activity, 'location' | 'participants' | 'endLocation'> & {
  latitude: number;
  longitude: number;
  address: string;
  activityType?: Activity['activityType'];
  durationMinutes?: number;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  participants?: Activity['participants'];
};

function mapBackendActivity(a: BackendActivity): Activity {
  const { latitude, longitude, address, endLatitude, endLongitude, endAddress, ...rest } = a;
  const activity: Activity = {
    ...rest,
    location: { latitude, longitude, address },
    activityType: a.activityType ?? 'route-based',
    participants: a.participants ?? [],
  } as Activity;
  if (endLatitude != null && endLongitude != null) {
    activity.endLocation = {
      latitude: endLatitude,
      longitude: endLongitude,
      address: endAddress ?? '',
    };
  }
  return activity;
}

export const activityService = {
  async getActivities(
    filters?: ActivityFilters,
    page = 1,
    limit = 20
  ): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.dateFrom) params.append('startDate', filters.dateFrom);
      if (filters.dateTo) params.append('endDate', filters.dateTo);
      if (filters.distanceMin !== undefined) params.append('minDistance', filters.distanceMin.toString());
      if (filters.distanceMax !== undefined) params.append('maxDistance', filters.distanceMax.toString());
      if (filters.latitude !== undefined) params.append('latitude', filters.latitude.toString());
      if (filters.longitude !== undefined) params.append('longitude', filters.longitude.toString());
      if (filters.radius !== undefined) params.append('radius', filters.radius.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.activityType) params.append('activityType', filters.activityType);
    }

    const response = await apiClient.get<{
      data: Activity[];
      pagination: { page: number; limit: number; total: number };
    }>(`/activities?${params.toString()}`);

    const { data, pagination } = response.data;
    const activities = (data as unknown as BackendActivity[]).map(mapBackendActivity);
    return {
      activities,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },

  async getActivityById(id: string): Promise<Activity> {
    const response = await apiClient.get<{ data: BackendActivity }>(
      `/activities/${id}`
    );
    return mapBackendActivity(response.data.data);
  },

  async getFeed(page = 1, limit = 20): Promise<ActivityListResponse> {
    const response = await apiClient.get<{
      data: BackendActivity[];
      pagination: { page: number; limit: number; total: number };
    }>(`/activities/feed?page=${page}&limit=${limit}`);

    const { data, pagination } = response.data;
    return {
      activities: data.map(mapBackendActivity),
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },

  async createActivity(data: CreateActivityData): Promise<Activity> {
    const body: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      scheduledDate: data.scheduledDate,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
      address: data.location.address,
      route: data.route,
      distance: data.distance,
      maxParticipants: data.maxParticipants,
      activityType: data.activityType ?? 'route-based',
      durationMinutes: data.durationMinutes,
    };

    if (data.endLocation) {
      body.endLatitude = data.endLocation.latitude;
      body.endLongitude = data.endLocation.longitude;
      body.endAddress = data.endLocation.address;
    }

    const response = await apiClient.post<{ data: BackendActivity }>(
      '/activities',
      body
    );
    return mapBackendActivity(response.data.data);
  },

  async updateActivity(id: string, data: UpdateActivityData): Promise<Activity> {
    const body: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      scheduledDate: data.scheduledDate,
      route: data.route,
      distance: data.distance,
      maxParticipants: data.maxParticipants,
      durationMinutes: data.durationMinutes,
    };

    if (data.location) {
      body.latitude = data.location.latitude;
      body.longitude = data.location.longitude;
      body.address = data.location.address;
    }

    const response = await apiClient.put<{ data: BackendActivity }>(
      `/activities/${id}`,
      body
    );
    return mapBackendActivity(response.data.data);
  },

  async deleteActivity(id: string): Promise<void> {
    await apiClient.delete(`/activities/${id}`);
  },

  async updateActivityStatus(id: string, status: 'in-progress' | 'completed'): Promise<Activity> {
    const response = await apiClient.put<{ data: BackendActivity }>(`/activities/${id}`, { status });
    return mapBackendActivity(response.data.data);
  },

  async joinActivity(id: string): Promise<void> {
    await apiClient.post(`/activities/${id}/join`);
  },

  async leaveActivity(id: string): Promise<void> {
    await apiClient.delete(`/activities/${id}/leave`);
  },

  async createRating(activityId: string, data: { rating: number; feedback?: string }): Promise<void> {
    await apiClient.post(`/activities/${activityId}/ratings`, data);
  },

  async getActivityRatings(activityId: string): Promise<ActivityRatingSummary> {
    const response = await apiClient.get<{
      data: {
        averageRating: number;
        ratingCount?: number;
        totalRatings?: number;
        ratings: ActivityRating[];
      };
    }>(`/activities/${activityId}/ratings`);

    const data = response.data.data;
    return {
      averageRating: data.averageRating,
      totalRatings: Number(data.totalRatings ?? data.ratingCount ?? 0),
      ratings: data.ratings ?? [],
    };
  },

  async bookmarkActivity(id: string): Promise<void> {
    await apiClient.post(`/activities/${id}/bookmark`, {});
  },

  async unbookmarkActivity(id: string): Promise<void> {
    await apiClient.delete(`/activities/${id}/bookmark`);
  },

  async getBookmarkedIds(): Promise<string[]> {
    const response = await apiClient.get<{ data: { ids: string[] } }>(`/activities/bookmarked/ids`);
    return response.data.data.ids ?? [];
  },
};
