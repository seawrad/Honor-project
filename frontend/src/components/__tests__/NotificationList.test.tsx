import { render, screen, waitFor } from '../../test/testUtils';
import { NotificationList } from '../NotificationList';
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

describe('NotificationList', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationService.getNotifications).mockResolvedValue(
      mockNotifications
    );
  });

  it('should display notifications', async () => {
    render(<NotificationList onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('活動提醒')).toBeInTheDocument();
      expect(screen.getByText('新追蹤者')).toBeInTheDocument();
    });
  });

  it('should display "mark all as read" button when there are unread notifications', async () => {
    render(<NotificationList onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('全部標記為已讀')).toBeInTheDocument();
    });
  });

  it('should mark notification as read when clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(notificationService.markAsRead).mockResolvedValue();

    render(<NotificationList onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('活動提醒')).toBeInTheDocument();
    });

    const notification = screen.getByText('活動提醒');
    await user.click(notification);

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  it('should mark all notifications as read', async () => {
    const user = userEvent.setup();
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue();

    render(<NotificationList onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('全部標記為已讀')).toBeInTheDocument();
    });

    const button = screen.getByText('全部標記為已讀');
    await user.click(button);

    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  it('should delete notification', async () => {
    const user = userEvent.setup();
    vi.mocked(notificationService.deleteNotification).mockResolvedValue();

    render(<NotificationList onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('活動提醒')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByLabelText('delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(notificationService.deleteNotification).toHaveBeenCalledWith('1');
    });
  });

  it('should display empty state when no notifications', async () => {
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: [],
      unreadCount: 0,
    });

    render(<NotificationList onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('沒有通知')).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    vi.mocked(notificationService.getNotifications).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<NotificationList onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    });
  });
});
