import React from 'react'
import { Outlet } from 'react-router-dom'
import FullSidebar from './FullSidebar'
import FullTopBar from './FullTopBar'

const FullLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-900">
      <FullSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <FullTopBar />
        <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default FullLayout