import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { RatingDialog } from '../RatingDialog';

describe('RatingDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(
      <RatingDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        activityTitle="晨跑活動"
      />
    );

    expect(screen.getByText('評價活動')).toBeInTheDocument();
    expect(screen.getByText('晨跑活動')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <RatingDialog
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        activityTitle="晨跑活動"
      />
    );

    expect(screen.queryByText('評價活動')).not.toBeInTheDocument();
  });

  it('allows user to select rating and submit', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <RatingDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        activityTitle="晨跑活動"
      />
    );

    // Select 5 stars
    const stars = screen.getAllByRole('radio');
    await user.click(stars[4]); // 5th star

    // Wait for button to be enabled
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /提交評分/i });
      expect(submitButton).not.toBeDisabled();
    });

    // Submit
    const submitButton = screen.getByRole('button', { name: /提交評分/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('allows user to add feedback', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);

    render(
      <RatingDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        activityTitle="晨跑活動"
      />
    );

    // Select rating
    const stars = screen.getAllByRole('radio');
    await user.click(stars[3]); // 4 stars

    // Add feedback
    const feedbackInput = screen.getByPlaceholderText('分享您的跑步體驗...');
    await user.type(feedbackInput, '很棒的活動！');

    // Wait for button to be enabled
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /提交評分/i });
      expect(submitButton).not.toBeDisabled();
    });

    // Submit
    const submitButton = screen.getByRole('button', { name: /提交評分/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('disables submit button when no rating selected', () => {
    render(
      <RatingDialog
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        activityTitle="晨跑活動"
      />
    );

    const submitButton = screen.getByRole('button', { name: /提交評分/i });
    expect(submitButton).toBeDisabled();
  });
});
