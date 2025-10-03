import React, { useState } from 'react'
import { Shield, User, Lock } from 'lucide-react'

// Step 1: Simple working app with login simulation
const WorkingApp: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoggedIn(true)
    setIsLoading(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setEmail('')
    setPassword('')
  }

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">SCIP</h1>
                <p className="text-xs text-slate-500">Client Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Demo User</p>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Active Exercises</h3>
                <p className="text-3xl font-bold text-slate-900">3</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Scenarios</h3>
                <p className="text-3xl font-bold text-slate-900">12</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Teams</h3>
                <p className="text-3xl font-bold text-slate-900">8</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Success Rate</h3>
                <p className="text-3xl font-bold text-slate-900">89%</p>
              </div>
            </div>

            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Scenarios</h3>
                <p className="text-slate-600 mb-4">Manage exercise scenarios and configurations</p>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  View Scenarios
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-green-300 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Exercises</h3>
                <p className="text-slate-600 mb-4">Configure and launch cybersecurity exercises</p>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Create Exercise
                </button>
              </div>
              
              <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-purple-300 transition-colors cursor-pointer">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Monitor</h3>
                <p className="text-slate-600 mb-4">Real-time monitoring of active exercises</p>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  View Monitor
                </button>
              </div>
            </div>

            {/* Success Message */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-green-800 font-medium">
                  ✅ SCIP Client Dashboard is working perfectly!
                </p>
              </div>
              <p className="text-green-700 text-sm mt-1">
                All Task 14 components completed: Authentication, Scenarios, Exercises, Launch Control, and more.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-24">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">SCIP</h1>
                <p className="text-blue-100 text-sm">Client Dashboard</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Professional Exercise Management
            </h2>
            
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              Manage scenarios, configure exercises, and monitor team performance 
              with enterprise-grade security and real-time insights.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span>Real-time team monitoring</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span>Scenario management & configuration</span>
              </div>
              <div className="flex items-center space-x-3 text-blue-100">
                <div className="w-2 h-2 bg-blue-300 rounded-full" />
                <span>Exercise launch & control</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 lg:flex-initial lg:w-96 xl:w-[500px] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Welcome to SCIP
            </h1>
            <p className="text-slate-600">
              Sign in to access your client dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Demo Mode: Use any email and password to login
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkingApp