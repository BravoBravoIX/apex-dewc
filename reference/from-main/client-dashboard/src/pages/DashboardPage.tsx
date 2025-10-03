import React from 'react'
import { BarChart3, Users, PlayCircle, FileText, TrendingUp, Clock } from 'lucide-react'

const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Overview of your exercises, scenarios, and team performance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <PlayCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">12</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Exercises</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">48</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Available Scenarios</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">156</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Participants</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">89%</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Exercises */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Exercises</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {[
                { name: 'Phishing Response Training', status: 'Completed', participants: 24, date: '2 hours ago' },
                { name: 'Incident Response Drill', status: 'In Progress', participants: 18, date: '1 day ago' },
                { name: 'Network Security Assessment', status: 'Completed', participants: 12, date: '3 days ago' },
              ].map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{exercise.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {exercise.participants} participants • {exercise.date}
                    </p>
                  </div>
                  <span className={`badge ${exercise.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                    {exercise.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Exercises */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Exercises</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {[
                { name: 'Red Team vs Blue Team', scheduled: 'Tomorrow 10:00 AM', participants: 32 },
                { name: 'Social Engineering Awareness', scheduled: 'Friday 2:00 PM', participants: 45 },
                { name: 'Malware Analysis Workshop', scheduled: 'Next Monday 9:00 AM', participants: 16 },
              ].map((exercise, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{exercise.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{exercise.scheduled}</span>
                    </div>
                  </div>
                  <span className="badge badge-primary">
                    {exercise.participants} registered
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Exercise Performance Trends</h3>
        </div>
        <div className="card-content">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Performance chart will be implemented here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage