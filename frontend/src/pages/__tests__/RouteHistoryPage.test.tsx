import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test/testUtils';
import { RouteHistoryPage } from '../RouteHistoryPage';
import { gpsService } from '../../services/gps.service';
import { RouteData } from '../../types/gps.types';

import { vi } from 'vitest';

// Mock services
vi.mock('../../services/gps.service');
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', displayName: 'Test User' },
  }),
}));

vi.mock('../../components/RouteVisualization', () => ({
  RouteVisualization: () => <div data-testid="route-visualization">Route Visualization</div>,
}));

const mockRoutes: RouteData[] = [
  {
    id: 'route-1',
    activityId: 'activity-1',
    userId: 'user-1',
    positions: [
      {
        latitude: 25.033,
        longitude: 121.5654,
        timestamp: new Date('2024-01-01T10:00:00'),
        accuracy: 10,
      },
    ],
    totalDistance: 5.5,
    averageSpeed: 11.0,
    duration: 1800,
    startTime: new Date('2024-01-01T10:00:00'),
    endTime: new Date('2024-01-01T10:30:00'),
  },
];

describe('RouteHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (gpsService.getUserRoutes as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<RouteHistoryPage />);

    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('should display routes after loading', async () => {
    (gpsService.getUserRoutes as any).mockResolvedValue(mockRoutes);

    render(<RouteHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('路線紀錄')).toBeInTheDocument();
      expect(screen.getByText('5.50')).toBeInTheDocument();
      expect(screen.getByText(/平均速度: 11.00/)).toBeInTheDocument();
    });
  });

  it('should display empty state when no routes', async () => {
    (gpsService.getUserRoutes as any).mockResolvedValue([]);

    render(<RouteHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('尚無路線記錄')).toBeInTheDocument();
    });
  });

  it('should display error message on failure', async () => {
    (gpsService.getUserRoutes as any).mockRejectedValue({
      response: { data: { error: { message: 'Failed to load routes' } } },
    });

    render(<RouteHistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load routes')).toBeInTheDocument();
    });
  });
});
