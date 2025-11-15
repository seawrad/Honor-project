import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { RegisterPage } from '../RegisterPage';
import * as authService from '../../services/auth.service';

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with all fields', () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/電子郵件/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^密碼/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/顯示名稱/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/年齡/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /註冊/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/電子郵件/i);
    const submitButton = screen.getByRole('button', { name: /註冊/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/請輸入有效的電子郵件地址/i)).toBeInTheDocument();
    });
  });

  it('validates password requirements', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/^密碼/i);
    const submitButton = screen.getByRole('button', { name: /註冊/i });
    
    // Test short password
    await user.type(passwordInput, 'short');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/密碼至少需要 8 個字元/i)).toBeInTheDocument();
    });

    // Clear and test password without numbers
    await user.clear(passwordInput);
    await user.type(passwordInput, 'onlyletters');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/密碼必須包含字母和數字/i)).toBeInTheDocument();
    });
  });

  it('validates age restriction (18-65)', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const ageInput = screen.getByLabelText(/年齡/i);
    const submitButton = screen.getByRole('button', { name: /註冊/i });

    // Test age below 18
    await user.type(ageInput, '17');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/年齡必須在 18 到 65 歲之間/i)).toBeInTheDocument();
    });

    // Test age above 65
    await user.clear(ageInput);
    await user.type(ageInput, '66');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/年齡必須在 18 到 65 歲之間/i)).toBeInTheDocument();
    });
  });

  it('requires terms acceptance', async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /註冊/i });
    
    // Fill all fields except terms
    await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^密碼/i), 'password123');
    await user.type(screen.getByLabelText(/顯示名稱/i), 'Test User');
    await user.type(screen.getByLabelText(/年齡/i), '25');
    
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/您必須同意服務條款/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.authService.register).mockResolvedValue({
      message: 'Registration successful',
      userId: '123',
    });

    render(<RegisterPage />);

    // Fill all fields with valid data
    await user.type(screen.getByLabelText(/電子郵件/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^密碼/i), 'password123');
    await user.type(screen.getByLabelText(/顯示名稱/i), 'Test User');
    await user.type(screen.getByLabelText(/年齡/i), '25');
    await user.click(screen.getByRole('checkbox'));

    const submitButton = screen.getByRole('button', { name: /註冊/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        age: 25,
        agreedToTerms: true,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { message: '註冊成功！請登入您的帳戶。' },
      });
    });
  });

  it('displays error for duplicate email', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.authService.register).mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'VALIDATION_DUPLICATE_EMAIL',
            message: 'Email already exists',
          },
        },
      },
    });

    render(<RegisterPage />);

    // Fill form
    await user.type(screen.getByLabelText(/電子郵件/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^密碼/i), 'password123');
    await user.type(screen.getByLabelText(/顯示名稱/i), 'Test User');
    await user.type(screen.getByLabelText(/年齡/i), '25');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /註冊/i }));

    await waitFor(() => {
      expect(screen.getByText(/此電子郵件已被註冊/i)).toBeInTheDocument();
    });
  });
});
