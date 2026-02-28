import React, { createContext, useState, useEffect, useCallback } from 'react';
import { AuthContextType, User, LoginCredentials, RegisterData, DEV_MODE_EMAILS } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../utils/tokenStorage';
import { RunCrewLoadingScreen } from '../components/RunCrewLoadingScreen';
import axios from 'axios';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    authService.logout().catch(() => {
      // Ignore logout errors
    });
    setUser(null);
    tokenStorage.clearAll();
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const refreshToken = useCallback(async (): Promise<void> => {
    const currentRefreshToken = tokenStorage.getRefreshToken();

    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }

    const tokens = await authService.refreshToken(currentRefreshToken);
    const persistent = tokenStorage.isPersistent();

    tokenStorage.setAccessToken(tokens.accessToken, persistent);
    tokenStorage.setRefreshToken(tokens.refreshToken, persistent);

    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;

    const currentUser = await authService.getCurrentUser(tokens.accessToken);
    setUser(currentUser);
    tokenStorage.setUser(currentUser, persistent);
  }, []);

  // Setup axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only retry on token expiry, not on login failure (invalid credentials)
        const isTokenExpired =
          error.response?.status === 401 &&
          error.response?.data?.error?.code === 'AUTH_TOKEN_EXPIRED';
        if (isTokenExpired && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await refreshToken();
            const newAccessToken = tokenStorage.getAccessToken();
            
            if (newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [refreshToken, logout]);

  // Initialize auth state from localStorage
  // Minimum 3.5s display so users can see the RunCrew loading animation
  const MIN_LOADING_MS = 3500;

  useEffect(() => {
    const startTime = Date.now();

    const initializeAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();
      const storedUser = tokenStorage.getUser();

      if (accessToken && storedUser) {
        try {
          const currentUser = await authService.getCurrentUser(accessToken);
          setUser(currentUser);
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error) {
          try {
            await refreshToken();
          } catch (refreshError) {
            tokenStorage.clearAll();
          }
        }
      }

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => setIsLoading(false), remaining);
    };

    initializeAuth();
  }, [refreshToken]);

  const login = async (credentials: LoginCredentials, options?: { keepLoggedIn?: boolean }): Promise<void> => {
    const response = await authService.login(credentials);
    const persistent = options?.keepLoggedIn !== false;

    setUser(response.user);
    tokenStorage.setAccessToken(response.accessToken, persistent);
    tokenStorage.setRefreshToken(response.refreshToken, persistent);
    tokenStorage.setUser(response.user, persistent);

    axios.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;
  };

  const register = async (data: RegisterData): Promise<void> => {
    await authService.register(data);
    // After registration, user needs to login
  };

  const isDeveloperMode = !!user && DEV_MODE_EMAILS.includes(user.email.toLowerCase());

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isDeveloperMode,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? <RunCrewLoadingScreen /> : children}
    </AuthContext.Provider>
  );
};
