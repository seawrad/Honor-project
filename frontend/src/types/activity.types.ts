export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Participant {
  userId: string;
  displayName: string;
  joinedAt: string;
}

export interface Activity {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  scheduledDate: string;
  location: Location;
  route: string;
  distance: number;
  maxParticipants: number;
  currentParticipants: number;
  participants: Participant[];
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface ActivityFilters {
  dateFrom?: string;
  dateTo?: string;
  distanceMin?: number;
  distanceMax?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export interface CreateActivityData {
  title: string;
  description: string;
  scheduledDate: string;
  location: Location;
  route: string;
  distance: number;
  maxParticipants: number;
}

export interface UpdateActivityData extends Partial<CreateActivityData> {}
