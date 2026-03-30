import apiClient from '../utils/apiClient';

export interface RunMemoryCard {
  id: string;
  activityId: string | null;
  routeId?: string;
  createdBy: string;
  createdAt: string;
  runDate: string;
  participantCount: number;
  totalDistance: number;
  averageSpeed: number;
  durationSeconds: number;
  weatherTemp?: number;
  weatherDesc?: string;
  newsHeadline?: string;
  aiImageUrl?: string;
  groupPhotoUrl?: string;
  messages: { userId: string; displayName: string; content: string }[];
  routeSummary?: { pointCount: number; pathPreview?: [number, number][] };
  newlyUnlockedAchievements?: string[];
}

export interface CreateMemoryCardData {
  activityId?: string | null;
  routeId?: string;
  runDate: string;
  participantCount: number;
  totalDistance: number;
  averageSpeed: number;
  durationSeconds: number;
  weatherTemp?: number;
  weatherDesc?: string;
  newsHeadline?: string;
  messages?: { userId: string; displayName: string; content: string }[];
  routeSummary?: { pointCount: number; pathPreview?: [number, number][] };
}

export const memoryCardService = {
  async create(data: CreateMemoryCardData): Promise<RunMemoryCard> {
    const response = await apiClient.post<{ data: RunMemoryCard }>('/memory-cards', data);
    return response.data.data;
  },

  async getById(id: string): Promise<RunMemoryCard> {
    const response = await apiClient.get<{ data: RunMemoryCard }>(`/memory-cards/${id}`);
    return response.data.data;
  },

  async getByActivityId(activityId: string): Promise<RunMemoryCard[]> {
    const response = await apiClient.get<{ data: RunMemoryCard[] }>(`/memory-cards/activity/${activityId}`);
    return response.data.data;
  },

  async getByRouteId(routeId: string): Promise<RunMemoryCard[]> {
    const response = await apiClient.get<{ data: RunMemoryCard[] }>(`/memory-cards/route/${routeId}`);
    return response.data.data;
  },
};