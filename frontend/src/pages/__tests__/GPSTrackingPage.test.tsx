import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { GPSTrackingPage } from '../GPSTrackingPage';

import { vi } from 'vitest';

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
  it('should render GPS tracking page with all components', () => {
    render(
      <BrowserRouter>
        <GPSTrackingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('GPS 追蹤')).toBeInTheDocument();
    expect(screen.getByTestId('gps-tracker')).toBeInTheDocument();
    expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('route-controls')).toBeInTheDocument();
  });

  it('should have a back button', () => {
    render(
      <BrowserRouter>
        <GPSTrackingPage />
      </BrowserRouter>
    );

    expect(screen.getByText('返回活動')).toBeInTheDocument();
  });
});
