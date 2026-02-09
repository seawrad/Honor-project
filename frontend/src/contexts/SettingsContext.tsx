import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import i18n from '../i18n'

export type Language = 'en' | 'zh-TW'
export type DistanceUnit = 'km' | 'miles'

export interface AppSettings {
  language: Language
  distanceUnit: DistanceUnit
  activityReminders: boolean
  chatNotifications: boolean
}

const STORAGE_KEY = 'app-settings'

const defaultSettings: AppSettings = {
  language: 'zh-TW',
  distanceUnit: 'km',
  activityReminders: true,
  chatNotifications: true,
}

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, unknown>
      const { theme: _removed, ...rest } = parsed
      return { ...defaultSettings, ...rest } as AppSettings
    }
  } catch (e) {
    console.warn('Failed to load settings:', e)
  }
  return defaultSettings
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to save settings:', e)
  }
}

interface SettingsContextType {
  settings: AppSettings
  setLanguage: (lang: Language) => void
  setDistanceUnit: (unit: DistanceUnit) => void
  setActivityReminders: (enabled: boolean) => void
  setChatNotifications: (enabled: boolean) => void
  updateSettings: (updates: Partial<AppSettings>) => void
  formatDistance: (km: number) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const setLanguage = useCallback((lang: Language) => {
    setSettingsState((s) => ({ ...s, language: lang }))
    i18n.changeLanguage(lang)
    localStorage.setItem('app-language', lang)
  }, [])

  const setDistanceUnit = useCallback((unit: DistanceUnit) => {
    setSettingsState((s) => ({ ...s, distanceUnit: unit }))
  }, [])

  const setActivityReminders = useCallback((enabled: boolean) => {
    setSettingsState((s) => ({ ...s, activityReminders: enabled }))
  }, [])

  const setChatNotifications = useCallback((enabled: boolean) => {
    setSettingsState((s) => ({ ...s, chatNotifications: enabled }))
  }, [])

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState((s) => {
      const next = { ...s, ...updates }
      if (updates.language) {
        i18n.changeLanguage(updates.language)
        localStorage.setItem('app-language', updates.language)
      }
      return next
    })
  }, [])

  const formatDistance = useCallback((km: number): string => {
    if (settings.distanceUnit === 'miles') {
      const miles = km * 0.621371
      return `${miles.toFixed(2)} mi`
    }
    return `${km.toFixed(2)} km`
  }, [settings.distanceUnit])

  const value: SettingsContextType = {
    settings,
    setLanguage,
    setDistanceUnit,
    setActivityReminders,
    setChatNotifications,
    updateSettings,
    formatDistance,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
