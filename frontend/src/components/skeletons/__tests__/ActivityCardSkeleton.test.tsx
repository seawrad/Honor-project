import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/testUtils';
import { ActivityCardSkeleton } from '../ActivityCardSkeleton';

describe('ActivityCardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<ActivityCardSkeleton />);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders multiple skeleton elements', () => {
    const { container } = render(<ActivityCardSkeleton />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(1);
  });
});
