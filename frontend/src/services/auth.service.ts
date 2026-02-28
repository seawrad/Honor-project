import axios from 'axios';
import { LoginCredentials, RegisterData, User, AuthTokens } from '../types/auth.types';

const API_BASE_URL = '/api';

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
    const response = await axios.post<{ data: LoginResponse }>(
      `${API_BASE_URL}/auth/login`,
      credentials
    );
    return response.data.data;
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await axios.post<{ data?: Record<string, unknown> }>(
      `${API_BASE_URL}/auth/register`,
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
    const response = await axios.post<{ data: { accessToken: string } }>(
      `${API_BASE_URL}/auth/refresh-token`,
      { refreshToken }
    );
    const { accessToken } = response.data.data;
    return { accessToken, refreshToken };
  },

  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await axios.get<{ data: { user: User } }>(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/logout`);
  },
};
