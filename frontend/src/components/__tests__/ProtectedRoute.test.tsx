import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/testUtils';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div>Redirected to {to}</div>,
    useLocation: () => ({ pathname: '/protected' }),
  };
});

describe('ProtectedRoute', () => {
  it('shows loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Redirected to /login')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        age: 25,
      },
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
