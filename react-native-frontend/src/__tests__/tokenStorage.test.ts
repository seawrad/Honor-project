import { tokenStorage } from '../utils/tokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('tokenStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setAccessToken and getAccessToken', () => {
    it('should store and retrieve access token', async () => {
      const token = 'access-token-123';

      await tokenStorage.setAccessToken(token);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(token);

      const retrieved = await tokenStorage.getAccessToken();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', token);
      expect(retrieved).toBe(token);
    });
  });

  describe('setRefreshToken and getRefreshToken', () => {
    it('should store and retrieve refresh token', async () => {
      const token = 'refresh-token-123';

      await tokenStorage.setRefreshToken(token);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(token);

      const retrieved = await tokenStorage.getRefreshToken();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', token);
      expect(retrieved).toBe(token);
    });
  });

  describe('clear', () => {
    it('should clear all tokens', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await tokenStorage.clear();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('setUser and getUser', () => {
    it('should store and retrieve user', async () => {
      const user = { id: '1', username: 'testuser' };

      await tokenStorage.setUser(user);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(user)
      );

      const retrieved = await tokenStorage.getUser();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
      expect(retrieved).toEqual(user);
    });
  });
});
