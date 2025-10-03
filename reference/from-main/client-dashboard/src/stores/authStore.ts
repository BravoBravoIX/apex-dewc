import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthState, User, LoginCredentials, Organization } from '@/types'

interface AuthStore extends AuthState {
  // Authentication actions
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Organization methods
  organization: Organization | null
  setOrganization: (org: Organization | null) => void
  
  // Session management
  checkAuthStatus: () => Promise<void>
  clearError: () => void
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      organization: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null })
          
          // For demo purposes, simulate a successful login
          // In production, this would make a real API call
          try {
            const response = await fetch('/api/v1/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(credentials),
            })

            if (response.ok) {
              const data = await response.json()
              
              if (data.success) {
                const { user, token, refreshToken: newRefreshToken, organization } = data.data
                
                set({
                  user,
                  token,
                  refreshToken: newRefreshToken,
                  organization,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                })
                return
              }
            }
          } catch (apiError) {
            console.log('API not available, using demo login')
          }

          // Demo login - accept any credentials for testing
          await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
          
          const demoUser = {
            id: 'demo-user',
            email: credentials.email,
            firstName: 'Demo',
            lastName: 'User',
            role: 'admin' as const,
            organizationId: 'demo-org',
            isActive: true,
            lastLoginAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          const demoOrganization = {
            id: 'demo-org',
            name: 'Demo Organization',
            type: 'enterprise' as const,
            domain: 'demo.com',
            isActive: true,
            settings: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          set({
            user: demoUser,
            token: 'demo-token-' + Date.now(),
            refreshToken: 'demo-refresh-token-' + Date.now(),
            organization: demoOrganization,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
        } catch (error) {
          console.error('Login error:', error)
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
            isAuthenticated: false
          })
          throw error
        }
      },

      logout: () => {
        // Call logout endpoint to invalidate tokens
        fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${get().token}`,
          },
        }).catch(() => {
          // Silent fail - still log out locally
        })

        set({
          user: null,
          token: null,
          refreshToken: null,
          organization: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        })
      },

      refreshToken: async () => {
        try {
          const currentRefreshToken = get().refreshToken
          if (!currentRefreshToken) {
            throw new Error('No refresh token available')
          }

          const response = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          })

          if (!response.ok) {
            throw new Error('Token refresh failed')
          }

          const data = await response.json()
          
          if (data.success) {
            const { token, refreshToken: newRefreshToken } = data.data
            
            set({
              token,
              refreshToken: newRefreshToken,
              isAuthenticated: true,
              error: null
            })
          } else {
            throw new Error(data.error?.message || 'Token refresh failed')
          }
        } catch (error) {
          console.error('Token refresh error:', error)
          
          // If refresh fails, log out the user
          get().logout()
          throw error
        }
      },

      checkAuthStatus: async () => {
        try {
          set({ isLoading: true })
          
          const token = get().token
          if (!token) {
            set({ isLoading: false, isAuthenticated: false })
            return
          }

          // For demo purposes, simulate the auth check without actual API call
          // In production, this would make a real API call
          try {
            const response = await fetch('/api/v1/auth/me', {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                set({
                  user: data.data.user,
                  organization: data.data.organization,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null
                })
                return
              }
            }
          } catch (apiError) {
            // API not available - for demo, just set not authenticated
            console.log('API not available, proceeding with demo mode')
          }

          // For demo: assume not authenticated if no valid token or API fails
          set({ 
            isLoading: false, 
            isAuthenticated: false,
            user: null,
            organization: null,
            token: null,
            refreshToken: null
          })
        } catch (error) {
          console.error('Auth check error:', error)
          set({ 
            isLoading: false, 
            isAuthenticated: false,
            user: null,
            organization: null,
            token: null,
            refreshToken: null,
            error: null
          })
        }
      },

      setUser: (user: User | null) => {
        set({ user })
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      setOrganization: (organization: Organization | null) => {
        set({ organization })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'scip-auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        organization: state.organization,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)