import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { PWAUpdatePrompt } from '../PWAUpdatePrompt';

describe('PWAUpdatePrompt', () => {
  beforeEach(() => {
    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        ready: Promise.resolve({
          addEventListener: () => {},
        }),
      },
    });
  });

  it('should render without crashing', () => {
    const { container } = render(<PWAUpdatePrompt />);
    expect(container).toBeTruthy();
  });
});
