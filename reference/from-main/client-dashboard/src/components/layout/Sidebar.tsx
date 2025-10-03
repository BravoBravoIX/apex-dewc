import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  PlayCircle, 
  Monitor, 
  BarChart3, 
  Users,
  Shield
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Scenarios', href: '/scenarios', icon: FileText },
  { name: 'Exercises', href: '/exercises', icon: PlayCircle },
  { name: 'Monitor', href: '/monitor', icon: Monitor },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Teams', href: '/teams', icon: Users },
]

const Sidebar: React.FC = () => {
  return (
    <aside className="dashboard-sidebar w-64">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center space-x-3 px-6 py-6 border-b border-slate-200 dark:border-slate-700">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">SCIP</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Client Portal</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'nav-item',
                  {
                    'active': isActive,
                  }
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            SCIP v2.0 Client Dashboard
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar