import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme, CircularProgress, Box } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider, useToast } from './components/ErrorToast'
import { ErrorHandler } from './utils/errorHandler'
import { frontendMonitoring } from './utils/monitoring'

// Initialize monitoring
frontendMonitoring.init()

// Eager load authentication pages for faster initial load
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

// Lazy load other pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const ActivityListPage = lazy(() => import('./pages/ActivityListPage').then(m => ({ default: m.ActivityListPage })))
const ActivityDetailPage = lazy(() => import('./pages/ActivityDetailPage').then(m => ({ default: m.ActivityDetailPage })))
const CreateActivityPage = lazy(() => import('./pages/CreateActivityPage').then(m => ({ default: m.CreateActivityPage })))
const EditActivityPage = lazy(() => import('./pages/EditActivityPage').then(m => ({ default: m.EditActivityPage })))
const CancelActivityPage = lazy(() => import('./pages/CancelActivityPage').then(m => ({ default: m.CancelActivityPage })))
const GPSTrackingPage = lazy(() => import('./pages/GPSTrackingPage').then(m => ({ default: m.GPSTrackingPage })))
const RouteHistoryPage = lazy(() => import('./pages/RouteHistoryPage').then(m => ({ default: m.RouteHistoryPage })))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })))
const UserSearchPage = lazy(() => import('./pages/UserSearchPage').then(m => ({ default: m.UserSearchPage })))
const FollowersPage = lazy(() => import('./pages/FollowersPage').then(m => ({ default: m.FollowersPage })))
const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage').then(m => ({ default: m.ActivityFeedPage })))
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })))

// Loading component
const LoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
)

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      '@media (min-width:600px)': {
        fontSize: '3rem',
      },
      '@media (min-width:960px)': {
        fontSize: '3.5rem',
      },
    },
    h2: {
      fontSize: '2rem',
      '@media (min-width:600px)': {
        fontSize: '2.5rem',
      },
      '@media (min-width:960px)': {
        fontSize: '3rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      '@media (min-width:600px)': {
        fontSize: '2rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2.5rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      '@media (min-width:600px)': {
        fontSize: '1.75rem',
      },
      '@media (min-width:960px)': {
        fontSize: '2rem',
      },
    },
    h5: {
      fontSize: '1.25rem',
      '@media (min-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h6: {
      fontSize: '1rem',
      '@media (min-width:600px)': {
        fontSize: '1.25rem',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '44px', // Touch-friendly size
          '@media (max-width:600px)': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: '44px',
          minHeight: '44px', // Touch-friendly size
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: '44px', // Touch-friendly size
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width:600px)': {
            paddingLeft: '24px',
            paddingRight: '24px',
          },
        },
      },
    },
  },
})

// Inner component to access toast context
function AppContent() {
  const { showToast } = useToast()

  useEffect(() => {
    // Set up error handler toast callback
    ErrorHandler.setToastCallback(showToast)
  }, [showToast])

  return (
    <BrowserRouter>
      <AuthProvider>
        <PWAUpdatePrompt />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities"
                element={
                  <ProtectedRoute>
                    <ActivityListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities/create"
                element={
                  <ProtectedRoute>
                    <CreateActivityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities/:id"
                element={
                  <ProtectedRoute>
                    <ActivityDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditActivityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities/:id/cancel"
                element={
                  <ProtectedRoute>
                    <CancelActivityPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities/:activityId/tracking"
                element={
                  <ProtectedRoute>
                    <GPSTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/routes/history"
                element={
                  <ProtectedRoute>
                    <RouteHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId"
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/search"
                element={
                  <ProtectedRoute>
                    <UserSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId/followers"
                element={
                  <ProtectedRoute>
                    <FollowersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users/:userId/following"
                element={
                  <ProtectedRoute>
                    <FollowersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feed"
                element={
                  <ProtectedRoute>
                    <ActivityFeedPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activities/:activityId/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
