import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import { UserProfilePage } from '../UserProfilePage';
import { userService } from '../../services/user.service';
import { UserProfile } from '../../types/user.types';

// Mock services
vi.mock('../../services/user.service', () => ({
  userService: {
    getUserProfile: vi.fn(),
  },
}));

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useParams
const mockParams = { userId: 'user-1' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockParams,
    useNavigate: () => vi.fn(),
  };
});

describe('UserProfilePage', () => {
  const mockProfile: UserProfile = {
    id: 'user-1',
    displayName: 'Test User',
    totalRuns: 15,
    totalDistance: 120.5,
    averageRating: 4.5,
    followersCount: 10,
    followingCount: 5,
    recentActivities: [
      {
        id: 'activity-1',
        title: 'Morning Run',
        scheduledDate: '2024-01-15T08:00:00Z',
        distance: 5,
        status: 'completed',
      },
    ],
    joinedDate: '2024-01-01T00:00:00Z',
  };

  const mockCurrentUser = {
    id: 'current-user',
    email: 'current@example.com',
    displayName: 'Current User',
    age: 25,
    createdAt: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockCurrentUser,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('displays loading spinner while fetching profile', () => {
    vi.mocked(userService.getUserProfile).mockImplementation(
      () => new Promise(() => {})
    );

    render(<UserProfilePage />);

    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('displays user profile information', async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue(mockProfile);

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.getByText('15')).toBeInTheDocument(); // Total runs
    expect(screen.getByText('120.5 km')).toBeInTheDocument(); // Total distance
    expect(screen.getByText('4.5')).toBeInTheDocument(); // Average rating
  });

  it('displays followers and following counts', async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue(mockProfile);

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Followers
      expect(screen.getByText('5')).toBeInTheDocument(); // Following
    });
  });

  it('displays recent activities', async () => {
    vi.mocked(userService.getUserProfile).mockResolvedValue(mockProfile);

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
    });
  });

  it('shows error message when profile fetch fails', async () => {
    vi.mocked(userService.getUserProfile).mockRejectedValue({
      response: {
        data: {
          error: {
            message: '找不到使用者',
          },
        },
      },
    });

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('找不到使用者')).toBeInTheDocument();
    });
  });

  it('does not show follow button for own profile', async () => {
    // Update mockParams to use current user's ID
    mockParams.userId = 'current-user';
    const ownProfile = { ...mockProfile, id: 'current-user' };
    vi.mocked(userService.getUserProfile).mockResolvedValue(ownProfile);

    render(<UserProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /追蹤/i })).not.toBeInTheDocument();
    
    // Reset mockParams
    mockParams.userId = 'user-1';
  });
});
