import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'zh-TW';
export type DistanceUnit = 'km' | 'miles';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: Language;
  distanceUnit: DistanceUnit;
  themeMode: ThemeMode;
  activityReminders: boolean;
  chatNotifications: boolean;
}

const SETTINGS_KEY = 'appSettings';

const defaultSettings: AppSettings = {
  language: 'en',
  distanceUnit: 'km',
  themeMode: 'system',
  activityReminders: true,
  chatNotifications: true,
};

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return defaultSettings;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  },

  async updateSettings(partialSettings: Partial<AppSettings>): Promise<AppSettings> {
    const currentSettings = await this.getSettings();
    const nextSettings = { ...currentSettings, ...partialSettings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    return nextSettings;
  },
};