import { render, screen } from '@testing-library/react';
import { RouteVisualization } from '../RouteVisualization';
import { RouteData } from '../../types/gps.types';

import { vi } from 'vitest';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polyline: () => <div data-testid="polyline" />,
  Marker: () => <div data-testid="marker" />,
}));

describe('RouteVisualization', () => {
  const mockRoute: RouteData = {
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
      {
        latitude: 25.034,
        longitude: 121.5664,
        timestamp: new Date('2024-01-01T10:30:00'),
        accuracy: 10,
      },
    ],
    totalDistance: 5.5,
    averageSpeed: 11.0,
    duration: 1800, // 30 minutes
    startTime: new Date('2024-01-01T10:00:00'),
    endTime: new Date('2024-01-01T10:30:00'),
  };

  it('should render route visualization with map', () => {
    render(<RouteVisualization route={mockRoute} />);

    expect(screen.getByText('路線視覺化')).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should display route statistics correctly', () => {
    render(<RouteVisualization route={mockRoute} />);

    expect(screen.getByText('路線統計')).toBeInTheDocument();
    expect(screen.getByText('5.50')).toBeInTheDocument(); // total distance
    expect(screen.getByText('11.00')).toBeInTheDocument(); // average speed
    expect(screen.getByText('30:00')).toBeInTheDocument(); // duration
    expect(screen.getByText('2')).toBeInTheDocument(); // GPS positions count
  });

  it('should display start and end times', () => {
    render(<RouteVisualization route={mockRoute} />);

    expect(screen.getByText('開始時間')).toBeInTheDocument();
    expect(screen.getByText('結束時間')).toBeInTheDocument();
  });

  it('should render polyline and markers', () => {
    render(<RouteVisualization route={mockRoute} />);

    expect(screen.getByTestId('polyline')).toBeInTheDocument();
    expect(screen.getAllByTestId('marker')).toHaveLength(2); // start and end markers
  });
});
