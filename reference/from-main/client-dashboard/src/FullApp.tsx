import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Layouts
import DashboardLayout from './components/layout/FullLayout'
import AuthLayout from './components/layout/AuthLayout'

// Pages
import LoginPage from './pages/FullLoginPage'
import DashboardPage from './pages/DashboardPage'
import ScenariosPage from './pages/ScenariosPage'
import ExercisesPage from './pages/ExercisesPage'
import MonitorPage from './pages/MonitorPage'
import ReportsPage from './pages/ReportsPage'
import TeamsPage from './pages/TeamsPage'

// Auth context
const AuthContext = React.createContext<{
  isAuthenticated: boolean
  user: any
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {}
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
    },
  },
})

const FullApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const login = async (email: string, password: string) => {
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setUser({
      id: 'demo-user',
      email,
      firstName: 'Demo',
      lastName: 'User',
      role: 'admin'
    })
    setIsAuthenticated(true)
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  const authValue = {
    isAuthenticated,
    user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Auth Routes */}
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
              /* Protected Routes */
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="scenarios" element={<ScenariosPage />} />
                <Route path="exercises" element={<ExercisesPage />} />
                <Route path="exercises/:id/monitor" element={<MonitorPage />} />
                <Route path="monitor" element={<MonitorPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            )}
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthContext.Provider>
  )
}

export { AuthContext }
export default FullApp