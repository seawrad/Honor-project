import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { activityService } from '../activity.service';

vi.mock('axios');
vi.mock('../../utils/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: () => 'mock-token',
  },
}));

describe('activity.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
    vi.mocked(axios.post).mockResolvedValue({ data: {} });
    vi.mocked(axios.put).mockResolvedValue({ data: {} });
    vi.mocked(axios.delete).mockResolvedValue({ data: {} });
  });

  describe('getActivities', () => {
    it('includes keyword in params when provided', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, limit: 20, total: 0 },
        },
      });

      await activityService.getActivities({ keyword: 'morning run' }, 1, 20);

      const callUrl = vi.mocked(axios.get).mock.calls[0][0];
      expect(callUrl).toContain('keyword=');
      expect(callUrl).toMatch(/keyword=(morning%20run|morning\+run)/);
    });
  });

  describe('bookmarkActivity', () => {
    it('calls POST /activities/:id/bookmark', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

      await activityService.bookmarkActivity('activity-123');

      expect(axios.post).toHaveBeenCalledWith(
        '/api/activities/activity-123/bookmark',
        {},
        { headers: { Authorization: 'Bearer mock-token' } }
      );
    });
  });

  describe('unbookmarkActivity', () => {
    it('calls DELETE /activities/:id/bookmark', async () => {
      vi.mocked(axios.delete).mockResolvedValue({ data: { success: true } });

      await activityService.unbookmarkActivity('activity-123');

      expect(axios.delete).toHaveBeenCalledWith(
        '/api/activities/activity-123/bookmark',
        { headers: { Authorization: 'Bearer mock-token' } }
      );
    });
  });

  describe('getBookmarkedIds', () => {
    it('returns ids from GET /activities/bookmarked/ids', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { data: { ids: ['id1', 'id2'] } },
      });

      const ids = await activityService.getBookmarkedIds();

      expect(ids).toEqual(['id1', 'id2']);
      expect(axios.get).toHaveBeenCalledWith(
        '/api/activities/bookmarked/ids',
        expect.any(Object)
      );
    });
  });

  describe('getBookmarkedActivities', () => {
    it('returns mapped activities from GET /activities/bookmarked', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: {
          data: [
            {
              id: 'a1',
              creatorId: 'u1',
              creatorName: 'Creator',
              title: 'Run',
              latitude: 25,
              longitude: 121,
              address: 'Taipei',
              scheduledDate: '2025-12-01',
              distance: 5,
              maxParticipants: 10,
              currentParticipants: 0,
              status: 'upcoming',
              route: '',
              description: '',
              createdAt: '2025-01-01',
              updatedAt: '2025-01-01',
            },
          ],
        },
      });

      const activities = await activityService.getBookmarkedActivities();

      expect(activities).toHaveLength(1);
      expect(activities[0].id).toBe('a1');
      expect(activities[0].title).toBe('Run');
      expect(activities[0].location).toEqual({
        latitude: 25,
        longitude: 121,
        address: 'Taipei',
      });
    });
  });
});
