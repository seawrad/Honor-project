import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { ActivityFilters } from '../ActivityFilters';

describe('ActivityFilters', () => {
  it('renders filter controls', () => {
    const mockOnFiltersChange = vi.fn();
    render(<ActivityFilters onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByText('篩選條件')).toBeInTheDocument();
  });

  it('expands and collapses filter panel', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    render(<ActivityFilters onFiltersChange={mockOnFiltersChange} />);

    // Initially collapsed
    expect(screen.queryByLabelText(/開始日期/)).not.toBeVisible();

    // Click to expand
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    // Now visible
    expect(screen.getByLabelText(/開始日期/)).toBeVisible();
    expect(screen.getByLabelText(/結束日期/)).toBeVisible();
  });

  it('applies filters when button clicked', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    render(<ActivityFilters onFiltersChange={mockOnFiltersChange} />);

    // Expand filters
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    // Set date filter
    const dateFromInput = screen.getByLabelText(/開始日期/);
    await user.type(dateFromInput, '2025-12-01');

    // Apply filters
    const applyButton = screen.getByRole('button', { name: /套用篩選/ });
    await user.click(applyButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        dateFrom: expect.any(String),
      })
    );
  });

  it('resets filters when reset button clicked', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    render(<ActivityFilters onFiltersChange={mockOnFiltersChange} />);

    // Expand filters
    const expandButton = screen.getByRole('button');
    await user.click(expandButton);

    // Set some filters
    const dateFromInput = screen.getByLabelText(/開始日期/);
    await user.type(dateFromInput, '2025-12-01');

    // Reset filters
    const resetButton = screen.getByRole('button', { name: /重置/ });
    await user.click(resetButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    expect(dateFromInput).toHaveValue('');
  });

  it('applies keyword filter when Enter is pressed in search field', async () => {
    const user = userEvent.setup();
    const mockOnFiltersChange = vi.fn();
    render(<ActivityFilters onFiltersChange={mockOnFiltersChange} />);

    const searchInput = screen.getByPlaceholderText(/搜尋活動標題、地點或描述/);
    await user.type(searchInput, 'morning run');
    await user.keyboard('{Enter}');

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'morning run',
      })
    );
  });

  it('renders search placeholder', () => {
    const mockOnFiltersChange = vi.fn();
    render(<ActivityFilters onFiltersChange={mockOnFiltersChange} />);

    expect(screen.getByPlaceholderText(/搜尋活動標題、地點或描述/)).toBeInTheDocument();
  });
});
