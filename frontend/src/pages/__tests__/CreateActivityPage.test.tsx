import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { CreateActivityPage } from '../CreateActivityPage';
import { activityService } from '../../services/activity.service';

vi.mock('../../services/activity.service');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('CreateActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create activity form', () => {
    render(<CreateActivityPage />);

    expect(screen.getByText('建立跑步活動')).toBeInTheDocument();
    expect(screen.getByLabelText(/活動標題/)).toBeInTheDocument();
    expect(screen.getByLabelText(/活動描述/)).toBeInTheDocument();
    expect(screen.getByLabelText(/活動時間/)).toBeInTheDocument();
    expect(screen.getByLabelText(/參加人數上限/)).toBeInTheDocument();
    expect(screen.getByLabelText(/距離/)).toBeInTheDocument();
    expect(screen.getByLabelText(/路線說明/)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<CreateActivityPage />);

    const titleInput = screen.getByLabelText(/活動標題/);
    const submitButton = screen.getByRole('button', { name: /建立活動/ });
    
    // Try to submit without filling required fields
    await user.click(submitButton);

    // Check that form validation prevents submission
    expect(titleInput).toBeRequired();
  });

  it('validates date is in the future', async () => {
    const user = userEvent.setup();
    render(<CreateActivityPage />);

    const titleInput = screen.getByLabelText(/活動標題/);
    const descInput = screen.getByLabelText(/活動描述/);
    const dateInput = screen.getByLabelText(/活動時間/);
    const distanceInput = screen.getByLabelText(/距離/);
    const routeInput = screen.getByLabelText(/路線說明/);

    await user.type(titleInput, 'Test Activity');
    await user.type(descInput, 'Test Description');
    await user.type(dateInput, '2020-01-01T10:00');
    await user.clear(distanceInput);
    await user.type(distanceInput, '5');
    await user.type(routeInput, 'Test Route');

    const submitButton = screen.getByRole('button', { name: /建立活動/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('活動時間必須在未來')).toBeInTheDocument();
    });
  });

  it('validates minimum participants', async () => {
    const user = userEvent.setup();
    render(<CreateActivityPage />);

    const participantsInput = screen.getByLabelText(/參加人數上限/);
    
    // Check that input has minimum constraint
    expect(participantsInput).toHaveAttribute('min', '2');
  });

  it('validates positive distance', async () => {
    const user = userEvent.setup();
    render(<CreateActivityPage />);

    const distanceInput = screen.getByLabelText(/距離/);
    
    // Check that input has minimum constraint
    expect(distanceInput).toHaveAttribute('min', '0.1');
  });
});
