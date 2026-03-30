import { authService, User, AuthTokens } from '../services/auth.service';
import { tokenStorage } from '../utils/tokenStorage';
import apiClient from '../utils/apiClient';

jest.mock('../utils/apiClient');
jest.mock('../utils/tokenStorage');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user and store tokens', async () => {
      const mockLoginData = {
        user: {
          id: '1',
          email: 'test@example.com',
          displayName: 'Test User',
          age: 21,
          createdAt: '2026-03-27T10:00:00Z',
        } as User,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: mockLoginData },
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockLoginData);
      expect(tokenStorage.setAccessToken).toHaveBeenCalledWith('access-token');
      expect(tokenStorage.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(tokenStorage.setUser).toHaveBeenCalledWith(mockLoginData.user);
    });

    it('should throw error on login failure', async () => {
      const error = new Error('Login failed');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        displayName: 'Test User',
        age: 21,
        createdAt: '2026-03-27T10:00:00Z',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: { user: mockUser } },
      });

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
    });
  });

  describe('logout', () => {
    it('should logout user and clear tokens', async () => {
      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(tokenStorage.clear).toHaveBeenCalled();
    });
  });
});
