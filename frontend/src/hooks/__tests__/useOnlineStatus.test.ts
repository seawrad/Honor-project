import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
  let onlineCallback: (() => void) | null = null;
  let offlineCallback: (() => void) | null = null;

  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock addEventListener
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'online') {
        onlineCallback = callback as () => void;
      } else if (event === 'offline') {
        offlineCallback = callback as () => void;
      }
    });

    // Mock removeEventListener
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    onlineCallback = null;
    offlineCallback = null;
  });

  it('should return true when online', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('should return false when offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('should update status when going offline', () => {
    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current).toBe(true);

    act(() => {
      if (offlineCallback) {
        offlineCallback();
      }
    });

    expect(result.current).toBe(false);
  });

  it('should update status when going online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOnlineStatus());
    
    expect(result.current).toBe(false);

    act(() => {
      if (onlineCallback) {
        onlineCallback();
      }
    });

    expect(result.current).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useOnlineStatus());
    
    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
