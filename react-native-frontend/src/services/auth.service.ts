import apiClient from '../utils/apiClient';
import { tokenStorage } from '../utils/tokenStorage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  age: number;
  agreedToTerms: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  age: number;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  message: string;
  userId: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<{ data: LoginResponse }>(
      '/auth/login',
      credentials
    );
    const loginData = response.data.data;
    
    // Store tokens and user
    await tokenStorage.setAccessToken(loginData.accessToken);
    await tokenStorage.setRefreshToken(loginData.refreshToken);
    await tokenStorage.setUser(loginData.user);
    
    return loginData;
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<{ data?: Record<string, unknown> }>(
      '/auth/register',
      data
    );
    const d = response.data?.data;
    const userId =
      d && typeof d === 'object'
        ? (d.userId as string | undefined) ?? (d.user as { id?: string } | undefined)?.id ?? ''
        : '';
    return { message: 'Registered', userId };
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<{ data: { accessToken: string } }>(
      '/auth/refresh-token',
      { refreshToken }
    );
    const { accessToken } = response.data.data;
    return { accessToken, refreshToken };
  },

  async getCurrentUser(accessToken?: string): Promise<User> {
    const response = await apiClient.get<{ data: { user: User } }>(
      '/auth/me'
    );
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    await tokenStorage.clear();
  },
};
