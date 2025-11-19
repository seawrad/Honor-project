import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/testUtils';
import { RatingsList } from '../RatingsList';
import { ActivityRating } from '../../types/activity.types';

describe('RatingsList', () => {
  const mockRatings: ActivityRating[] = [
    {
      id: '1',
      activityId: 'activity-1',
      userId: 'user-1',
      userName: '張三',
      rating: 5,
      feedback: '非常棒的活動！',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      activityId: 'activity-1',
      userId: 'user-2',
      userName: '李四',
      rating: 4,
      createdAt: '2024-01-16T10:00:00Z',
    },
  ];

  it('renders rating summary', () => {
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.5}
        totalRatings={2}
      />
    );

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('基於 2 則評價')).toBeInTheDocument();
  });

  it('renders individual ratings', () => {
    render(
      <RatingsList
        ratings={mockRatings}
        averageRating={4.5}
        totalRatings={2}
      />
    );

    expect(screen.getByText('張三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('非常棒的活動！')).toBeInTheDocument();
  });

  it('shows message when no ratings', () => {
    render(
      <RatingsList
        ratings={[]}
        averageRating={0}
        totalRatings={0}
      />
    );

    expect(screen.getByText('尚無評價')).toBeInTheDocument();
  });

  it('displays N/A for zero average rating', () => {
    render(
      <RatingsList
        ratings={[]}
        averageRating={0}
        totalRatings={0}
      />
    );

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
