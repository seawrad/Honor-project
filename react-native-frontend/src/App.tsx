import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './navigation/AppNavigator';
import { SettingsProvider } from './contexts/SettingsContext';
import { authService } from './services/auth.service';
import { tokenStorage } from './utils/tokenStorage';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      // Check if user has valid tokens
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();

      if (accessToken && refreshToken) {
        try {
          // Validate token by fetching current user
          await authService.getCurrentUser(accessToken);
          setIsLoggedIn(true);
        } catch (error) {
          // Token might be expired, try refreshing
          try {
            await authService.refreshToken(refreshToken);
            setIsLoggedIn(true);
          } catch (refreshError) {
            // Refresh failed, clear tokens
            await tokenStorage.clear();
            setIsLoggedIn(false);
          }
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Restore token failed:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
      SplashScreen.hideAsync();
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SettingsProvider>
      <AppNavigator isLoggedIn={isLoggedIn} onAuthSuccess={handleAuthSuccess} onLogout={handleLogout} />
    </SettingsProvider>
  );
}
