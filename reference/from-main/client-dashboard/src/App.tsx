import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { useBrandingStore } from '@/stores/brandingStore'
import { useBranding } from '@/hooks/useBranding'

// Layout Components
import Layout from '@/components/layout/Layout'
import AuthLayout from '@/components/layout/AuthLayout'

// Pages
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ScenariosPage from '@/pages/ScenariosPage'
import ExercisesPage from '@/pages/ExercisesPage'
import MonitorPage from '@/pages/MonitorPage'
import ReportsPage from '@/pages/ReportsPage'
import TeamsPage from '@/pages/TeamsPage'
import TeamDashboardPage from '@/pages/TeamDashboardPage'

// Common Components
import LoadingScreen from '@/components/common/LoadingScreen'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import NotificationContainer from '@/components/common/NotificationContainer'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

/**
 * Main Client Dashboard Application
 * 
 * This is the root component that orchestrates the entire client dashboard experience.
 * It handles:
 * - Authentication and routing
 * - Organization branding and theming
 * - Global state management
 * - Error boundaries and loading states
 * - React Query configuration
 */
function App() {
  const { isAuthenticated, isLoading: authLoading, checkAuthStatus } = useAuthStore()
  const { branding } = useBrandingStore()
  
  // Initialize authentication state
  useEffect(() => {
    // Add a small delay and error handling
    const initAuth = async () => {
      try {
        await checkAuthStatus()
      } catch (error) {
        console.error('Auth initialization failed:', error)
        // If auth check fails, assume not authenticated
        // This prevents infinite loading
      }
    }
    
    initAuth()
  }, [checkAuthStatus])
  
  // Apply organization branding
  useBranding(branding)

  // Show loading screen while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-slate-600 text-lg font-medium">
            Initializing SCIP Dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="app">
            <Routes>
              {/* Authentication Routes */}
              {!isAuthenticated ? (
                <>
                  <Route path="/login" element={
                    <AuthLayout>
                      <LoginPage />
                    </AuthLayout>
                  } />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </>
              ) : (
                /* Protected Dashboard Routes */
                <>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="scenarios" element={<ScenariosPage />} />
                    <Route path="exercises" element={<ExercisesPage />} />
                    <Route path="exercises/:id/monitor" element={<MonitorPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="teams" element={<TeamsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                  {/* Team Dashboard - Standalone Route */}
                  <Route path="/team-dashboard" element={<TeamDashboardPage />} />
                  <Route path="/team-dashboard/:teamId" element={<TeamDashboardPage />} />
                  <Route path="/team-dashboard/:teamId/:exerciseId" element={<TeamDashboardPage />} />
                </>
              )}
            </Routes>

            {/* Global Notification System */}
            <NotificationContainer />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
