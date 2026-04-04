import { activityService } from '../services/activity.service';
import apiClient from '../utils/apiClient';

jest.mock('../utils/apiClient');

describe('activityService', () => {
  const mockActivity = {
    id: '1',
    creatorId: 'creator-1',
    creatorName: 'Creator Runner',
    title: 'Morning Run',
    description: 'Let\'s run together',
    scheduledDate: '2026-03-28T08:00:00Z',
    latitude: 22.3193,
    longitude: 114.1694,
    address: 'Victoria Park, Hong Kong',
    route: 'Victoria Park Loop',
    distance: 5,
    participants: [],
    currentParticipants: 0,
    maxParticipants: 10,
    status: 'upcoming',
    activityType: 'route-based',
    durationMinutes: 30,
    createdAt: '2026-03-27T10:00:00Z',
    updatedAt: '2026-03-27T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActivities', () => {
    it('should fetch activities list', async () => {
      const mockResponse = {
        data: {
          data: [mockActivity],
          pagination: { page: 1, limit: 20, total: 1 },
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await activityService.getActivities();

      expect(result.activities).toHaveLength(1);
      expect(result.activities[0].title).toBe('Morning Run');
      expect(result.total).toBe(1);
    });

    it('should apply filters to request', async () => {
      const filters = {
        keyword: 'running',
        dateFrom: '2026-03-27',
        radius: 5,
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: {
          data: [],
          pagination: { page: 1, limit: 20, total: 0 },
        },
      });

      await activityService.getActivities(filters);

      expect(apiClient.get).toHaveBeenCalled();
      const callUrl = (apiClient.get as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('keyword=running');
      expect(callUrl).toContain('startDate=2026-03-27');
      expect(callUrl).toContain('radius=5');
    });
  });

  describe('getActivityById', () => {
    it('should fetch activity by id', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockActivity },
      });

      const result = await activityService.getActivityById('1');

      expect(result.id).toBe('1');
      expect(result.title).toBe('Morning Run');
    });
  });

  describe('joinActivity', () => {
    it('should join activity', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({});

      await activityService.joinActivity('1');

      expect(apiClient.post).toHaveBeenCalledWith('/activities/1/join');
    });
  });
});
