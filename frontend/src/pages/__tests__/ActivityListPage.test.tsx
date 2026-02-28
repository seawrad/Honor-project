import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import { ActivityListPage } from '../ActivityListPage';
import { activityService } from '../../services/activity.service';

vi.mock('../../services/activity.service');

const mockActivities = [
  {
    id: '1',
    creatorId: 'user1',
    creatorName: 'John Doe',
    title: 'Morning Run',
    description: 'A nice morning run',
    scheduledDate: '2025-12-01T08:00:00Z',
    location: {
      latitude: 25.0330,
      longitude: 121.5654,
      address: 'Taipei 101',
    },
    route: 'Around the park',
    distance: 5,
    maxParticipants: 10,
    currentParticipants: 3,
    participants: [],
    status: 'upcoming' as const,
    createdAt: '2025-11-01T00:00:00Z',
  },
  {
    id: '2',
    creatorId: 'user2',
    creatorName: 'Jane Smith',
    title: 'Evening Run',
    description: 'Evening run by the river',
    scheduledDate: '2025-12-02T18:00:00Z',
    location: {
      latitude: 25.0400,
      longitude: 121.5700,
      address: 'Riverside Park',
    },
    route: 'River trail',
    distance: 8,
    maxParticipants: 15,
    currentParticipants: 15,
    participants: [],
    status: 'upcoming' as const,
    createdAt: '2025-11-02T00:00:00Z',
  },
];

describe('ActivityListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(activityService.getBookmarkedIds).mockResolvedValue([]);
    vi.mocked(activityService.getBookmarkedActivities).mockResolvedValue([]);
  });

  it('renders activity list with activities', async () => {
    vi.mocked(activityService.getActivities).mockResolvedValue({
      activities: mockActivities,
      total: 2,
      page: 1,
      limit: 12,
    });

    render(<ActivityListPage />);

    expect(screen.getByText('跑步活動')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Morning Run').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Evening Run').length).toBeGreaterThan(0);
    });
  });

  it('displays loading state', async () => {
    vi.mocked(activityService.getActivities).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ActivityListPage />);

    await waitFor(() => {
      // Loading shows skeletons, not CircularProgress
      expect(screen.getByText('即將開始的活動')).toBeInTheDocument();
      expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    });
  });

  it('displays error message on failure', async () => {
    vi.mocked(activityService.getActivities).mockRejectedValue({
      response: {
        data: {
          error: {
            message: '載入失敗',
          },
        },
      },
    });

    render(<ActivityListPage />);

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
    });
  });

  it('displays empty state when no activities', async () => {
    vi.mocked(activityService.getActivities).mockResolvedValue({
      activities: [],
      total: 0,
      page: 1,
      limit: 12,
    });

    render(<ActivityListPage />);

    await waitFor(() => {
      expect(screen.getByText('目前沒有活動')).toBeInTheDocument();
    });
  });

  it('displays full indicator for full activities', async () => {
    vi.mocked(activityService.getActivities).mockResolvedValue({
      activities: mockActivities,
      total: 2,
      page: 1,
      limit: 12,
    });

    render(<ActivityListPage />);

    await waitFor(() => {
      const fullChips = screen.getAllByText('已滿');
      expect(fullChips.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('displays saved activities section when user has bookmarks', async () => {
    const savedActivity = {
      ...mockActivities[0],
      id: 'saved-1',
      activityType: 'route-based' as const,
    };
    vi.mocked(activityService.getActivities).mockResolvedValue({
      activities: [],
      total: 0,
      page: 1,
      limit: 12,
    });
    vi.mocked(activityService.getBookmarkedIds).mockResolvedValue(['saved-1']);
    vi.mocked(activityService.getBookmarkedActivities).mockResolvedValue([savedActivity]);

    render(<ActivityListPage />);

    await waitFor(
      () => {
        expect(screen.getByText('已收藏活動')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
