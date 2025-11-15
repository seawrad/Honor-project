import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/testUtils';
import userEvent from '@testing-library/user-event';
import { UserSearchPage } from '../UserSearchPage';
import { userService } from '../../services/user.service';
import { UserSearchResult } from '../../types/user.types';

// Mock services
vi.mock('../../services/user.service', () => ({
  userService: {
    searchUsers: vi.fn(),
  },
}));

describe('UserSearchPage', () => {
  const mockSearchResults: UserSearchResult[] = [
    {
      id: 'user-1',
      displayName: 'John Doe',
      totalRuns: 10,
      averageRating: 4.5,
      isFollowing: false,
    },
    {
      id: 'user-2',
      displayName: 'Jane Smith',
      totalRuns: 15,
      averageRating: 4.8,
      isFollowing: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input', () => {
    render(<UserSearchPage />);

    expect(screen.getByPlaceholderText('輸入使用者名稱...')).toBeInTheDocument();
  });

  it('displays initial message before search', () => {
    render(<UserSearchPage />);

    expect(screen.getByText('輸入名稱開始搜尋使用者')).toBeInTheDocument();
  });

  it('searches users when typing in search box', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.searchUsers).mockResolvedValue(mockSearchResults);

    render(<UserSearchPage />);

    const searchInput = screen.getByPlaceholderText('輸入使用者名稱...');
    await user.type(searchInput, 'John');

    await waitFor(
      () => {
        expect(userService.searchUsers).toHaveBeenCalledWith('John');
      },
      { timeout: 1000 }
    );
  });

  it('displays search results', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.searchUsers).mockResolvedValue(mockSearchResults);

    render(<UserSearchPage />);

    const searchInput = screen.getByPlaceholderText('輸入使用者名稱...');
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('shows no results message when search returns empty', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.searchUsers).mockResolvedValue([]);

    render(<UserSearchPage />);

    const searchInput = screen.getByPlaceholderText('輸入使用者名稱...');
    await user.type(searchInput, 'NonExistent');

    await waitFor(() => {
      expect(screen.getByText('找不到符合的使用者')).toBeInTheDocument();
    });
  });

  it('displays error message when search fails', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.searchUsers).mockRejectedValue({
      response: {
        data: {
          error: {
            message: '搜尋失敗',
          },
        },
      },
    });

    render(<UserSearchPage />);

    const searchInput = screen.getByPlaceholderText('輸入使用者名稱...');
    await user.type(searchInput, 'Test');

    await waitFor(() => {
      expect(screen.getByText('搜尋失敗')).toBeInTheDocument();
    });
  });
});
