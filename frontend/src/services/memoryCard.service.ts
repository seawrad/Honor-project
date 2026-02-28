import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const API_BASE_URL = '/api';

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
    const response = await axios.post<{ data: RunMemoryCard }>(
      `${API_BASE_URL}/memory-cards`,
      data,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },

  async getById(id: string): Promise<RunMemoryCard> {
    const response = await axios.get<{ data: RunMemoryCard }>(
      `${API_BASE_URL}/memory-cards/${id}`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },

  async getByActivityId(activityId: string): Promise<RunMemoryCard[]> {
    const response = await axios.get<{ data: RunMemoryCard[] }>(
      `${API_BASE_URL}/memory-cards/activity/${activityId}`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },

  async getByRouteId(routeId: string): Promise<RunMemoryCard[]> {
    const response = await axios.get<{ data: RunMemoryCard[] }>(
      `${API_BASE_URL}/memory-cards/route/${routeId}`,
      { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } }
    );
    return response.data.data;
  },
};
