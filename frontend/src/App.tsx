import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { ActivityListPage } from './pages/ActivityListPage'
import { ActivityDetailPage } from './pages/ActivityDetailPage'
import { CreateActivityPage } from './pages/CreateActivityPage'
import { EditActivityPage } from './pages/EditActivityPage'
import { CancelActivityPage } from './pages/CancelActivityPage'
import { GPSTrackingPage } from './pages/GPSTrackingPage'
import { RouteHistoryPage } from './pages/RouteHistoryPage'

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
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
