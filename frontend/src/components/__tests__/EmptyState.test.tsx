import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material';
import { EmptyState } from '../EmptyState';

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('EmptyState', () => {
  it('renders title and description', () => {
    renderWithTheme(
      <EmptyState
        variant="no-activities"
        title="No activities yet"
        description="Create your first activity to get started."
      />
    );

    expect(screen.getByText('No activities yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first activity to get started.')).toBeInTheDocument();
  });

  it('renders action button when onAction and actionLabel provided', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderWithTheme(
      <EmptyState
        variant="no-activities"
        title="No activities"
        actionLabel="Create Activity"
        onAction={onAction}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Activity' });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render button when onAction is not provided', () => {
    renderWithTheme(
      <EmptyState
        variant="no-activities"
        title="No activities"
        actionLabel="Create Activity"
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders all variants without error', () => {
    const variants = [
      'no-activities',
      'no-routes',
      'no-achievements',
      'no-feed',
      'no-chat',
      'no-data',
      'no-friends',
    ] as const;

    variants.forEach((variant) => {
      const { unmount } = renderWithTheme(
        <EmptyState variant={variant} title={`Empty ${variant}`} />
      );
      expect(screen.getByText(`Empty ${variant}`)).toBeInTheDocument();
      unmount();
    });
  });
});
