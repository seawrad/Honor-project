import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/testUtils';
import { UserCard } from '../UserCard';
import { UserSearchResult } from '../../types/user.types';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('UserCard', () => {
  const mockUser: UserSearchResult = {
    id: 'user-1',
    displayName: 'Test User',
    totalRuns: 10,
    averageRating: 4.5,
    isFollowing: false,
  };

  const mockCurrentUser = {
    id: 'current-user',
    email: 'current@example.com',
    displayName: 'Current User',
    age: 25,
    createdAt: '2024-01-01',
  };

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockCurrentUser,
      isAuthenticated: true,
      isLoading: false,
    });
    mockNavigate.mockClear();
  });

  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('10 次跑步')).toBeInTheDocument();
  });

  it('displays rating when available', () => {
    render(<UserCard user={mockUser} />);

    expect(screen.getByText('(4.5)')).toBeInTheDocument();
  });

  it('shows follow button for other users', () => {
    render(<UserCard user={mockUser} />);

    expect(screen.getByRole('button', { name: /追蹤/i })).toBeInTheDocument();
  });

  it('does not show follow button for own profile', () => {
    const ownUser: UserSearchResult = {
      ...mockUser,
      id: 'current-user',
    };

    render(<UserCard user={ownUser} />);

    expect(screen.queryByRole('button', { name: /追蹤/i })).not.toBeInTheDocument();
  });

  it('navigates to user profile when card is clicked', () => {
    render(<UserCard user={mockUser} />);

    const card = screen.getByText('Test User').closest('.MuiCard-root');
    card?.click();

    expect(mockNavigate).toHaveBeenCalledWith('/users/user-1');
  });
});
