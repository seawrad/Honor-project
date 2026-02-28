import React from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../i18n';

// Mock Notification API (not available in jsdom; must be constructor for `new Notification()`)
class MockNotification {
  constructor(_title: string, _options?: NotificationOptions) {}
  static permission = 'denied' as NotificationPermission;
  static requestPermission = () => Promise.resolve('denied' as NotificationPermission);
}
Object.defineProperty(globalThis, 'Notification', {
  value: MockNotification,
  writable: true,
  configurable: true,
});

// Mock AuthProvider to skip 3.5s loading delay in tests
// Must export AuthContext so useAuth hook (from hooks/useAuth) can use useContext
// Export for tests that need to assert on login/register calls
export const mockAuthValue = {
  user: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
};
vi.mock('../contexts/AuthContext', () => ({
  AuthContext: React.createContext(mockAuthValue),
  AuthProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  useAuth: () => mockAuthValue,
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});
