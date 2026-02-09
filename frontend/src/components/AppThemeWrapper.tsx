import { useMemo, useState, useEffect } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { useSettings } from '../contexts/SettingsContext'

const baseThemeOptions = {
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  typography: {
    h1: { fontSize: '2.5rem', '@media (min-width:600px)': { fontSize: '3rem' }, '@media (min-width:960px)': { fontSize: '3.5rem' } },
    h2: { fontSize: '2rem', '@media (min-width:600px)': { fontSize: '2.5rem' }, '@media (min-width:960px)': { fontSize: '3rem' } },
    h3: { fontSize: '1.75rem', '@media (min-width:600px)': { fontSize: '2rem' }, '@media (min-width:960px)': { fontSize: '2.5rem' } },
    h4: { fontSize: '1.5rem', '@media (min-width:600px)': { fontSize: '1.75rem' }, '@media (min-width:960px)': { fontSize: '2rem' } },
    h5: { fontSize: '1.25rem', '@media (min-width:600px)': { fontSize: '1.5rem' } },
    h6: { fontSize: '1rem', '@media (min-width:600px)': { fontSize: '1.25rem' } },
  },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: '44px', '@media (max-width:600px)': { fontSize: '0.875rem' } } } },
    MuiIconButton: { styleOverrides: { root: { minWidth: '44px', minHeight: '44px' } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiInputBase-root': { minHeight: '44px' } } } },
    MuiContainer: { styleOverrides: { root: { paddingLeft: '16px', paddingRight: '16px', '@media (min-width:600px)': { paddingLeft: '24px', paddingRight: '24px' } } } },
  },
}

function getResolvedMode(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }
  return theme
}

interface AppThemeWrapperProps {
  children: React.ReactNode
}

export function AppThemeWrapper({ children }: AppThemeWrapperProps) {
  const { settings } = useSettings()
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemDark(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const mode = useMemo(() => {
    if (settings.theme === 'system') return systemDark ? 'dark' : 'light'
    return settings.theme
  }, [settings.theme, systemDark])

  const theme = useMemo(
    () =>
      createTheme({
        ...baseThemeOptions,
        palette: {
          ...baseThemeOptions.palette,
          mode,
        },
      }),
    [mode]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
