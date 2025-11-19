import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications } from '../useNotifications';
import { notificationService } from '../../services/notification.service';
import { vi } from 'vitest';

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

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationService.getNotifications).mockResolvedValue(
      mockNotifications
    );
  });

  it('should fetch notifications on mount', async () => {
    const { result } = renderHook(() => useNotifications());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('should mark notification as read', async () => {
    vi.mocked(notificationService.markAsRead).mockResolvedValue();

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.markAsRead('1');

    await waitFor(() => {
      const notification = result.current.notifications.find((n) => n.id === '1');
      expect(notification?.isRead).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it('should mark all notifications as read', async () => {
    vi.mocked(notificationService.markAllAsRead).mockResolvedValue();

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.markAllAsRead();

    await waitFor(() => {
      expect(result.current.notifications.every((n) => n.isRead)).toBe(true);
      expect(result.current.unreadCount).toBe(0);
    });
  });

  it('should delete notification', async () => {
    vi.mocked(notificationService.deleteNotification).mockResolvedValue();

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.deleteNotification('1');

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications.find((n) => n.id === '1')).toBeUndefined();
    });
  });

  it('should handle fetch error', async () => {
    vi.mocked(notificationService.getNotifications).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load notifications');
  });
});
