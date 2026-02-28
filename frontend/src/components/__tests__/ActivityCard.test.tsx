import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { ActivityCard } from '../ActivityCard';
import { Activity } from '../../types/activity.types';

const mockActivity: Activity = {
  id: '1',
  creatorId: 'user1',
  creatorName: 'John Doe',
  title: 'Morning Run',
  description: 'A nice morning run',
  scheduledDate: '2025-12-01T08:00:00Z',
  location: {
    latitude: 25.033,
    longitude: 121.5654,
    address: 'Taipei 101',
  },
  route: 'Around the park',
  distance: 5,
  maxParticipants: 10,
  currentParticipants: 3,
  participants: [],
  status: 'upcoming',
  activityType: 'route-based',
  createdAt: '2025-11-01T00:00:00Z',
};

describe('ActivityCard', () => {
  it('renders activity details', () => {
    render(<ActivityCard activity={mockActivity} />);

    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Taipei 101')).toBeInTheDocument();
    expect(screen.getByText(/5.*公里/)).toBeInTheDocument();
    expect(screen.getByText('查看詳情')).toBeInTheDocument();
  });

  it('shows bookmark button when onBookmarkToggle is provided', () => {
    const onBookmarkToggle = vi.fn();
    render(
      <ActivityCard
        activity={mockActivity}
        isBookmarked={false}
        onBookmarkToggle={onBookmarkToggle}
      />
    );

    const bookmarkButton = screen.getByRole('button', { name: /收藏活動/ });
    expect(bookmarkButton).toBeInTheDocument();
  });

  it('calls onBookmarkToggle when bookmark button clicked', async () => {
    const user = userEvent.setup();
    const onBookmarkToggle = vi.fn();
    render(
      <ActivityCard
        activity={mockActivity}
        isBookmarked={false}
        onBookmarkToggle={onBookmarkToggle}
      />
    );

    const bookmarkButton = screen.getByRole('button', { name: /收藏活動/ });
    await user.click(bookmarkButton);

    expect(onBookmarkToggle).toHaveBeenCalledWith('1', true);
  });

  it('shows filled bookmark when isBookmarked is true', () => {
    const onBookmarkToggle = vi.fn();
    render(
      <ActivityCard
        activity={mockActivity}
        isBookmarked={true}
        onBookmarkToggle={onBookmarkToggle}
      />
    );

    const unbookmarkButton = screen.getByRole('button', { name: /取消收藏/ });
    expect(unbookmarkButton).toBeInTheDocument();
  });

  it('displays full chip when activity is full', () => {
    const fullActivity = { ...mockActivity, currentParticipants: 10, maxParticipants: 10 };
    render(<ActivityCard activity={fullActivity} />);

    expect(screen.getByText('已滿')).toBeInTheDocument();
  });
});
