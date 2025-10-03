import React from 'react'
import { Users, Plus, UserPlus } from 'lucide-react'

const TeamsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Teams</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage teams and participants
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary inline-flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Invite Members</span>
          </button>
          <button className="btn-primary inline-flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-content">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Team management interface will be implemented here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamsPage