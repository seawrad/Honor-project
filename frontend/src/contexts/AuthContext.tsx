import React, { createContext, useState, useEffect, useCallback } from 'react';
import { AuthContextType, User, LoginCredentials, RegisterData } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { tokenStorage } from '../utils/tokenStorage';
import axios from 'axios';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Setup axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
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
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();
      const storedUser = tokenStorage.getUser();

      if (accessToken && storedUser) {
        try {
          // Verify token is still valid
          const currentUser = await authService.getCurrentUser(accessToken);
          setUser(currentUser);
          
          // Setup axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (error) {
          // Token invalid, try to refresh
          try {
            await refreshToken();
          } catch (refreshError) {
            // Refresh failed, clear storage
            tokenStorage.clearAll();
          }
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

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

  const logout = useCallback(() => {
    authService.logout().catch(() => {
      // Ignore logout errors
    });
    
    setUser(null);
    tokenStorage.clearAll();
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const refreshToken = async (): Promise<void> => {
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
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
