import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  PlayCircle, 
  Monitor, 
  BarChart3, 
  Users,
  Shield,
  Settings,
  Bell
} from 'lucide-react'
import { clsx } from 'clsx'

const FullSidebar: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Scenario Management', path: '/scenarios' },
    { icon: PlayCircle, label: 'Exercise Operations', path: '/exercises' },
    { icon: Monitor, label: 'Real-time Monitor', path: '/monitor' },
    { icon: BarChart3, label: 'Reports & Analytics', path: '/reports' },
    { icon: Users, label: 'Team Management', path: '/teams' },
  ]

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="w-64 bg-slate-800 text-slate-100 border-r border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">SCIP</h1>
            <p className="text-xs text-slate-400">Client Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              'flex items-center p-3 rounded-lg transition-colors duration-200 group',
              isActive(item.path)
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            )}
          >
            <item.icon className={clsx(
              'w-5 h-5 mr-3 transition-colors',
              isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'
            )} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <div className="space-y-2">
          <Link
            to="/settings"
            className="flex items-center p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 mr-3" />
            <span className="text-sm">Settings</span>
          </Link>
          
          <div className="flex items-center p-2 text-slate-400">
            <Bell className="w-4 h-4 mr-3" />
            <span className="text-sm">Notifications</span>
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            SCIP v2.0 Client Portal
          </p>
        </div>
      </div>
    </div>
  )
}

export default FullSidebar