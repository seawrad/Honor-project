export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  age?: number;
  totalRuns: number;
  totalDistance: number;
  averageRating: number;
  followersCount: number;
  followingCount: number;
  avatarUrl?: string | null;
  isFollowing?: boolean;
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

export interface UpdateProfileData {
  displayName?: string;
  age?: number;
  avatarUrl?: string | null;
}

export interface UserStatsSummary {
  weeklyDistanceKm: number;
  monthlyCompletedActivities: number;
  monthlyDistanceKm: number;
  level: {
    name: string;
    nameZh: string;
    currentKm: number;
    nextLevelKm: number | null;
    progressPercent: number;
  };
}
