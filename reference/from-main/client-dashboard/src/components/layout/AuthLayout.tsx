import React from 'react'
import { Shield } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex">
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
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute bottom-32 right-32 w-20 h-20 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 right-8 w-16 h-16 bg-white/5 rounded-full" />
      </div>
      
      {/* Right Panel - Auth Form */}
      <div className="flex-1 lg:flex-initial lg:w-96 xl:w-[500px] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout