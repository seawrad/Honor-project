import { render, screen } from '@testing-library/react';
import { PerformanceMetrics } from '../PerformanceMetrics';
import { PerformanceMetrics as MetricsType } from '../../types/gps.types';

describe('PerformanceMetrics', () => {
  const mockMetrics: MetricsType = {
    currentSpeed: 10.5,
    averageSpeed: 9.8,
    distance: 5.25,
    elapsedTime: 1920, // 32 minutes
  };

  it('should render performance metrics correctly', () => {
    render(<PerformanceMetrics metrics={mockMetrics} />);

    expect(screen.getByText('效能指標')).toBeInTheDocument();
    expect(screen.getByText('5.25')).toBeInTheDocument(); // distance
    expect(screen.getByText('10.50')).toBeInTheDocument(); // current speed
    expect(screen.getByText('9.80')).toBeInTheDocument(); // average speed
    expect(screen.getByText('32:00')).toBeInTheDocument(); // elapsed time
  });

  it('should format time correctly for hours', () => {
    const metricsWithHours: MetricsType = {
      ...mockMetrics,
      elapsedTime: 3665, // 1 hour, 1 minute, 5 seconds
    };

    render(<PerformanceMetrics metrics={metricsWithHours} />);
    expect(screen.getByText('1:01:05')).toBeInTheDocument();
  });

  it('should display zero values correctly', () => {
    const zeroMetrics: MetricsType = {
      currentSpeed: 0,
      averageSpeed: 0,
      distance: 0,
      elapsedTime: 0,
    };

    render(<PerformanceMetrics metrics={zeroMetrics} />);
    expect(screen.getAllByText('0.00')).toHaveLength(3); // distance, current speed, average speed
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });
});
