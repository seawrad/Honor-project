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

export type ActivityType = 'time-based' | 'route-based';

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
  activityType: ActivityType;
  durationMinutes?: number;
  endLocation?: Location;
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
  status?: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  activityType?: ActivityType;
}

export interface CreateActivityData {
  title: string;
  description: string;
  scheduledDate: string;
  location: Location;
  route: string;
  distance: number;
  maxParticipants: number;
  activityType: ActivityType;
  durationMinutes?: number;
  endLocation?: Location;
}

export interface UpdateActivityData extends Partial<CreateActivityData> {}

export interface ActivityRating {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  rating: number;
  feedback?: string;
  createdAt: string;
}

export interface CreateRatingData {
  rating: number;
  feedback?: string;
}

export interface ActivityRatingSummary {
  averageRating: number;
  totalRatings: number;
  ratings: ActivityRating[];
}
