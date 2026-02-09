import React, { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Link,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../contexts/SettingsContext'
import { useAuth } from '../hooks/useAuth'
import type { Language, ThemeMode, DistanceUnit } from '../contexts/SettingsContext'

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { settings, setLanguage, setTheme, setDistanceUnit, setActivityReminders, setChatNotifications } =
    useSettings()
  const [savedSnack, setSavedSnack] = useState(false)

  const handleLanguageChange = (e: SelectChangeEvent<string>) => {
    const val = e.target.value as Language
    setLanguage(val)
    setSavedSnack(true)
  }

  const handleThemeChange = (e: SelectChangeEvent<string>) => {
    setTheme(e.target.value as ThemeMode)
    setSavedSnack(true)
  }

  const handleUnitChange = (e: SelectChangeEvent<string>) => {
    setDistanceUnit(e.target.value as DistanceUnit)
    setSavedSnack(true)
  }

  const handleActivityRemindersChange = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setActivityReminders(checked)
    setSavedSnack(true)
  }

  const handleChatNotificationsChange = (_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setChatNotifications(checked)
    setSavedSnack(true)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to={isAuthenticated ? '/' : '/login'}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowBackIcon fontSize="small" /> {isAuthenticated ? t('backToHome') : t('backToLogin')}
        </Link>
      </Box>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5">{t('settings')}</Typography>
        </Box>

        {/* General */}
        <Typography variant="subtitle1" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
          {t('general')}
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('language')}</InputLabel>
          <Select
            value={settings.language}
            label={t('language')}
            onChange={handleLanguageChange}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="zh-TW">繁體中文</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('units')}</InputLabel>
          <Select
            value={settings.distanceUnit}
            label={t('units')}
            onChange={handleUnitChange}
          >
            <MenuItem value="km">{t('km')}</MenuItem>
            <MenuItem value="miles">{t('miles')}</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        {/* Appearance */}
        <Typography variant="subtitle1" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
          {t('appearance')}
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>{t('theme')}</InputLabel>
          <Select value={settings.theme} label={t('theme')} onChange={handleThemeChange}>
            <MenuItem value="light">{t('light')}</MenuItem>
            <MenuItem value="dark">{t('dark')}</MenuItem>
            <MenuItem value="system">{t('system')}</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 3 }} />

        {/* Notifications */}
        <Typography variant="subtitle1" color="primary" fontWeight="bold" sx={{ mb: 2 }}>
          {t('notifications')}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={settings.activityReminders}
              onChange={handleActivityRemindersChange}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('activityReminders')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('activityRemindersDesc')}
              </Typography>
            </Box>
          }
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.chatNotifications}
              onChange={handleChatNotificationsChange}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body1">{t('chatNotifications')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('chatNotificationsDesc')}
              </Typography>
            </Box>
          }
        />
      </Paper>

      <Snackbar
        open={savedSnack}
        autoHideDuration={2000}
        onClose={() => setSavedSnack(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSavedSnack(false)}>
          {t('saved')}
        </Alert>
      </Snackbar>
    </Container>
  )
}
