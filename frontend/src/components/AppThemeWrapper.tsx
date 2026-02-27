import { useMemo } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { useSettings } from '../contexts/SettingsContext'

/* RunCrew brand palette */
const lightPalette = {
  primary: { main: '#00B8D4', light: '#4DD4ED', dark: '#0097A7' },
  secondary: { main: '#6EE0FF', light: '#B3F0FF', dark: '#18c9e8' },
  warning: { main: '#FFD34E' },
  background: { default: '#F7FBFF', paper: '#FFFFFF' },
  text: { primary: '#0A2640', secondary: '#3A3A3A' },
}

const darkPalette = {
  primary: { main: '#4DD4ED', light: '#80DEEA', dark: '#00B8D4' },
  secondary: { main: '#6EE0FF', light: '#B3F0FF', dark: '#18c9e8' },
  warning: { main: '#FFD34E' },
  background: { default: '#0A1929', paper: '#132F4C' },
  text: { primary: '#E7EBF0', secondary: '#B2BAC2' },
}

const baseThemeOptions = (mode: 'light' | 'dark') => ({
  palette: {
    ...(mode === 'light' ? lightPalette : darkPalette),
    mode,
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
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minHeight: '44px', borderRadius: 12, '@media (max-width:600px)': { fontSize: '0.875rem' } },
        containedPrimary: {
          background: `linear-gradient(180deg, #00B8D4 0%, #0097A7 100%)`,
          '&:hover': { background: `linear-gradient(180deg, #18c9e8 0%, #00B8D4 100%)` },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(160deg, #00B8D4 0%, #18c9e8 50%, #6EE0FF 100%)`,
        },
      },
    },
    MuiIconButton: { styleOverrides: { root: { minWidth: '44px', minHeight: '44px' } } },
    MuiTextField: { styleOverrides: { root: { '& .MuiInputBase-root': { minHeight: '44px', borderRadius: 12 } } } },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#132F4C',
        },
      },
    },
    MuiContainer: { styleOverrides: { root: { paddingLeft: '16px', paddingRight: '16px', '@media (min-width:600px)': { paddingLeft: '24px', paddingRight: '24px' } } } },
    MuiTypography: {
      styleOverrides: {
        root: { color: 'inherit' },
        h1: { color: 'inherit' },
        h2: { color: 'inherit' },
        h3: { color: 'inherit' },
        h4: { color: 'inherit' },
        h5: { color: 'inherit' },
        h6: { color: 'inherit' },
      },
    },
  },
})

interface AppThemeWrapperProps {
  children: React.ReactNode
}

function getResolvedMode(themeMode: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (themeMode === 'system') {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return themeMode
}

export function AppThemeWrapper({ children }: AppThemeWrapperProps) {
  const { settings } = useSettings()
  const resolvedMode = getResolvedMode(settings.themeMode)
  const theme = useMemo(
    () => createTheme(baseThemeOptions(resolvedMode) as any),
    [resolvedMode]
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
