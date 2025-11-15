export interface UserProfile {
  id: string;
  displayName: string;
  totalRuns: number;
  totalDistance: number;
  averageRating: number;
  followersCount: number;
  followingCount: number;
  recentActivities: RecentActivity[];
  joinedDate: string;
}

export interface RecentActivity {
  id: string;
  title: string;
  scheduledDate: string;
  distance: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
}

export interface UserSearchResult {
  id: string;
  displayName: string;
  totalRuns: number;
  averageRating: number;
  isFollowing: boolean;
}

export interface SocialConnection {
  followerId: string;
  followingId: string;
  createdAt: string;
}
