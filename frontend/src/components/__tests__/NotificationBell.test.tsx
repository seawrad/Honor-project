import { render, screen, waitFor } from '../../test/testUtils';
import { NotificationBell } from '../NotificationBell';
import { notificationService } from '../../services/notification.service';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

vi.mock('../../services/notification.service');

const mockNotifications = {
  notifications: [
    {
      id: '1',
      userId: 'user1',
      type: 'activity_reminder' as const,
      title: '活動提醒',
      message: '您的活動將在 1 小時後開始',
      relatedId: 'activity1',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user1',
      type: 'new_follower' as const,
      title: '新追蹤者',
      message: 'John 開始追蹤您',
      relatedId: 'user2',
      isRead: true,
      createdAt: new Date().toISOString(),
    },
  ],
  unreadCount: 1,
};

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationService.getNotifications).mockResolvedValue(
      mockNotifications
    );
  });

  it('should display notification icon with unread count badge', async () => {
    render(<NotificationBell />);

    await waitFor(() => {
      const badge = screen.getByText('1');
      expect(badge).toBeInTheDocument();
    });
  });

  it('should open notification dropdown on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /notifications/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('通知')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', () => {
    render(<NotificationBell />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
