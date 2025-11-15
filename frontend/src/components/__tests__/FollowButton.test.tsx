import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { FollowButton } from '../FollowButton';
import { userService } from '../../services/user.service';

// Mock user service
vi.mock('../../services/user.service', () => ({
  userService: {
    followUser: vi.fn(),
    unfollowUser: vi.fn(),
  },
}));

describe('FollowButton', () => {
  const mockOnFollowChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders follow button when not following', () => {
    render(
      <FollowButton
        userId="user-1"
        isFollowing={false}
        onFollowChange={mockOnFollowChange}
      />
    );

    expect(screen.getByRole('button', { name: /追蹤/i })).toBeInTheDocument();
  });

  it('renders unfollow button when following', () => {
    render(
      <FollowButton
        userId="user-1"
        isFollowing={true}
        onFollowChange={mockOnFollowChange}
      />
    );

    expect(screen.getByRole('button', { name: /取消追蹤/i })).toBeInTheDocument();
  });

  it('calls followUser when follow button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.followUser).mockResolvedValue();

    render(
      <FollowButton
        userId="user-1"
        isFollowing={false}
        onFollowChange={mockOnFollowChange}
      />
    );

    const button = screen.getByRole('button', { name: /追蹤/i });
    await user.click(button);

    await waitFor(() => {
      expect(userService.followUser).toHaveBeenCalledWith('user-1');
      expect(mockOnFollowChange).toHaveBeenCalledWith(true);
    });
  });

  it('calls unfollowUser when unfollow button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.unfollowUser).mockResolvedValue();

    render(
      <FollowButton
        userId="user-1"
        isFollowing={true}
        onFollowChange={mockOnFollowChange}
      />
    );

    const button = screen.getByRole('button', { name: /取消追蹤/i });
    await user.click(button);

    await waitFor(() => {
      expect(userService.unfollowUser).toHaveBeenCalledWith('user-1');
      expect(mockOnFollowChange).toHaveBeenCalledWith(false);
    });
  });

  it('disables button while loading', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.followUser).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <FollowButton
        userId="user-1"
        isFollowing={false}
        onFollowChange={mockOnFollowChange}
      />
    );

    const button = screen.getByRole('button', { name: /追蹤/i });
    await user.click(button);

    expect(button).toBeDisabled();
  });
});
