import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Bell, Search, Settings, LogOut, User } from 'lucide-react'

const Header: React.FC = () => {
  const { user, organization, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="dashboard-header">
      <div className="flex items-center justify-between w-full">
        {/* Left: Search */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search scenarios, exercises..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: User actions */}
        <div className="flex items-center space-x-4">
          {/* Organization info */}
          {organization && (
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {organization.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {organization.type}
              </p>
            </div>
          )}

          {/* Notifications */}
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative">
            <div className="flex items-center space-x-3 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header