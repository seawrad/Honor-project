import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '../LoginPage';

// Mock useAuth hook
const mockLogin = vi.fn();
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Mock RunCrewLoadingScreen to call onComplete immediately (avoids 4.8s wait)
vi.mock('../../components/RunCrewLoadingScreen', () => ({
  RunCrewLoadingScreen: ({ onComplete }: { onComplete?: () => void }) => {
    if (onComplete) {
      queueMicrotask(onComplete);
    }
    return <div data-testid="loading-screen" />;
  },
}));

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn().mockReturnValue({ state: null });
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getPasswordInput = () =>
    screen.getByLabelText((content) => content.includes('密碼') && !content.includes('顯示'));

  it('renders login form with email and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/電子郵件/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登入/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/電子郵件/i);
    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/請輸入有效的電子郵件地址/i)).toBeInTheDocument();
    });
  });

  it('requires password field', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /登入/i });
    
    await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/密碼為必填/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
    await user.type(getPasswordInput(), 'password123');
    await user.click(screen.getByRole('button', { name: /登入/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        { keepLoggedIn: true }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('displays error for invalid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'AUTH_INVALID_CREDENTIALS',
            message: 'Invalid credentials',
          },
        },
      },
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
    await user.type(getPasswordInput(), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /登入/i }));

    await waitFor(() => {
      expect(screen.getByText(/電子郵件或密碼不正確/i)).toBeInTheDocument();
    });
  });

  it('displays network error message', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({
      request: {},
      message: 'Network Error',
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
    await user.type(getPasswordInput(), 'password123');
    await user.click(screen.getByRole('button', { name: /登入/i }));

    await waitFor(() => {
      expect(screen.getByText(/無法連接到伺服器/i)).toBeInTheDocument();
    });
  });

  it('shows success message from registration redirect', () => {
    mockUseLocation.mockReturnValue({
      state: { message: '註冊成功！請登入您的帳戶。' },
    });

    render(<LoginPage />);

    expect(screen.getByText(/註冊成功！請登入您的帳戶。/i)).toBeInTheDocument();
  });
});
