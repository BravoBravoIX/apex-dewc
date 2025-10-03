import React from 'react'
import { BarChart3, Download, Filter } from 'lucide-react'

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Exercise analytics and performance reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary inline-flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="btn-primary inline-flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Reports and analytics interface will be implemented here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage