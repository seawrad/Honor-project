import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { DMChatProvider } from './contexts/DMChatContext'
import { AppThemeWrapper } from './components/AppThemeWrapper'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
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
import { TermsPage } from './pages/TermsPage'
import { PrivacyPage } from './pages/PrivacyPage'

// Lazy load other pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const ActivityListPage = lazy(() => import('./pages/ActivityListPage').then(m => ({ default: m.ActivityListPage })))
const ActivityDetailPage = lazy(() => import('./pages/ActivityDetailPage').then(m => ({ default: m.ActivityDetailPage })))
const CreateActivityPage = lazy(() => import('./pages/CreateActivityPage').then(m => ({ default: m.CreateActivityPage })))
const EditActivityPage = lazy(() => import('./pages/EditActivityPage').then(m => ({ default: m.EditActivityPage })))
const CancelActivityPage = lazy(() => import('./pages/CancelActivityPage').then(m => ({ default: m.CancelActivityPage })))
const GPSTrackingPage = lazy(() => import('./pages/GPSTrackingPage').then(m => ({ default: m.GPSTrackingPage })))
const SoloRunPage = lazy(() => import('./pages/SoloRunPage').then(m => ({ default: m.SoloRunPage })))
const RouteHistoryPage = lazy(() => import('./pages/RouteHistoryPage').then(m => ({ default: m.RouteHistoryPage })))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })))
const UserSearchPage = lazy(() => import('./pages/UserSearchPage').then(m => ({ default: m.UserSearchPage })))
const FollowersPage = lazy(() => import('./pages/FollowersPage').then(m => ({ default: m.FollowersPage })))
const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage').then(m => ({ default: m.ActivityFeedPage })))
const ChatPage = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ChatListPage = lazy(() => import('./pages/ChatListPage').then(m => ({ default: m.ChatListPage })))
const RunMemoryCardPage = lazy(() => import('./pages/RunMemoryCardPage').then(m => ({ default: m.RunMemoryCardPage })))
const AchievementsPage = lazy(() => import('./pages/AchievementsPage').then(m => ({ default: m.AchievementsPage })))
const StatsPage = lazy(() => import('./pages/StatsPage').then(m => ({ default: m.StatsPage })))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))

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
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DMChatProvider>
                      <AppLayout />
                    </DMChatProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<HomePage />} />
                <Route path="activities" element={<ActivityListPage />} />
                <Route path="activities/create" element={<CreateActivityPage />} />
                <Route path="activities/:id" element={<ActivityDetailPage />} />
                <Route path="activities/:id/edit" element={<EditActivityPage />} />
                <Route path="activities/:id/cancel" element={<CancelActivityPage />} />
                <Route path="activities/:activityId/tracking" element={<GPSTrackingPage />} />
                <Route path="run-now" element={<SoloRunPage />} />
                <Route path="activities/:activityId/chat" element={<ChatPage />} />
                <Route path="routes/history" element={<RouteHistoryPage />} />
                <Route path="memory-cards/:cardId" element={<RunMemoryCardPage />} />
                <Route path="users/:userId" element={<UserProfilePage />} />
                <Route path="users/search" element={<UserSearchPage />} />
                <Route path="users/:userId/followers" element={<FollowersPage />} />
                <Route path="users/:userId/following" element={<FollowersPage />} />
                <Route path="feed" element={<ActivityFeedPage />} />
                <Route path="chat-list" element={<ChatListPage />} />
                <Route path="achievements" element={<AchievementsPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
              </Route>
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
      <SettingsProvider>
        <AppThemeWrapper>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AppThemeWrapper>
      </SettingsProvider>
    </ErrorBoundary>
  )
}

export default App
