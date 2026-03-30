import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AppSettings, settingsService } from '../services/settings.service';
import { getThemeColors, brandColors } from '../utils/brand';

type ThemeColors = typeof brandColors;

type SettingsContextValue = {
  settings: AppSettings;
  loading: boolean;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  formatDistanceKm: (km: number, decimals?: number) => string;
  formatSpeedKmh: (kmh: number, decimals?: number) => string;
  distanceUnitShort: string;
  speedUnitShort: string;
  isDarkMode: boolean;
  themeColors: ThemeColors;
};

const defaultSettings: AppSettings = {
  language: 'en',
  distanceUnit: 'km',
  themeMode: 'system',
  activityReminders: true,
  chatNotifications: true,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const KM_TO_MILES = 0.621371;

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const deviceTheme = useColorScheme();

  useEffect(() => {
    let active = true;

    settingsService.getSettings().then((storedSettings) => {
      if (active) {
        setSettings(storedSettings);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SettingsContextValue>(() => {
    const useMiles = settings.distanceUnit === 'miles';
    const isDarkMode = settings.themeMode === 'dark' || (settings.themeMode === 'system' && deviceTheme === 'dark');

    return {
      settings,
      loading,
      isDarkMode,
      themeColors: getThemeColors(isDarkMode),
      updateSetting: async (key, value) => {
        const previousSettings = settings;
        const optimisticSettings = { ...settings, [key]: value };
        setSettings(optimisticSettings);
        try {
          const persistedSettings = await settingsService.updateSettings({ [key]: value });
          setSettings(persistedSettings);
        } catch {
          setSettings(previousSettings);
          throw new Error('Failed to persist setting');
        }
      },
      formatDistanceKm: (km, decimals = 2) => {
        const valueInUnit = useMiles ? km * KM_TO_MILES : km;
        return valueInUnit.toFixed(decimals);
      },
      formatSpeedKmh: (kmh, decimals = 1) => {
        const valueInUnit = useMiles ? kmh * KM_TO_MILES : kmh;
        return valueInUnit.toFixed(decimals);
      },
      distanceUnitShort: useMiles ? 'mi' : 'km',
      speedUnitShort: useMiles ? 'mph' : 'km/h',
    };
  }, [loading, settings, deviceTheme]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useAppSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used inside SettingsProvider');
  }
  return context;
};