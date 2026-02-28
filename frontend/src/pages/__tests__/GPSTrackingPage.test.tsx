import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { GPSTrackingPage } from '../GPSTrackingPage';

import { vi } from 'vitest';
import { mockAuthValue } from '../../test/setup';

vi.mock('../../services/activity.service', () => ({
  activityService: {
    getActivityById: vi.fn().mockResolvedValue({
      id: 'test-activity-id',
      title: 'Test Activity',
      creatorId: 'user-1',
      participants: [{ userId: 'user-1' }],
    }),
    updateActivityStatus: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock useAuth - user must be host or participant
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ ...mockAuthValue, user: { id: 'user-1' } }),
}));

// Mock the hooks and components
vi.mock('../../hooks/useGPSTracker', () => ({
  useGPSTracker: () => ({
    isTracking: false,
    positions: [],
    currentPosition: null,
    metrics: {
      currentSpeed: 0,
      averageSpeed: 0,
      distance: 0,
      elapsedTime: 0,
    },
    error: null,
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
    clearPositions: vi.fn(),
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ activityId: 'test-activity-id' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../components/GPSTracker', () => ({
  GPSTracker: () => <div data-testid="gps-tracker">GPS Tracker</div>,
}));

vi.mock('../../components/PerformanceMetrics', () => ({
  PerformanceMetrics: () => <div data-testid="performance-metrics">Performance Metrics</div>,
}));

vi.mock('../../components/RouteRecordingControls', () => ({
  RouteRecordingControls: () => <div data-testid="route-controls">Route Controls</div>,
}));

describe('GPSTrackingPage', () => {
  it('should render GPS tracking page with all components', async () => {
    render(
      <BrowserRouter>
        <GPSTrackingPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/GPS 追蹤|GPS Tracking/)).toBeInTheDocument();
    });
    expect(screen.getByTestId('gps-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('route-controls')).toBeInTheDocument();
  });

  it('should have a back button', async () => {
    render(
      <BrowserRouter>
        <GPSTrackingPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/返回活動|Back to activity/)).toBeInTheDocument();
    });
  });
});
