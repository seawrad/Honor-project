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
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      credentials
    );
    return response.data;
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await axios.post<RegisterResponse>(
      `${API_BASE_URL}/auth/register`,
      data
    );
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await axios.post<AuthTokens>(
      `${API_BASE_URL}/auth/refresh-token`,
      { refreshToken }
    );
    return response.data;
  },

  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await axios.get<User>(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  },

  async logout(): Promise<void> {
    await axios.post(`${API_BASE_URL}/auth/logout`);
  },
};
