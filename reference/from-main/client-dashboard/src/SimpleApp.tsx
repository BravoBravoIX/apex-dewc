import React from 'react'

const SimpleApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          SCIP Client Dashboard
        </h1>
        <p className="text-slate-600 mb-8">
          Simple version working - React is functioning correctly
        </p>
        <div className="space-y-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Login (Demo)
          </button>
          <br />
          <div className="text-sm text-slate-500">
            App running on port 3001
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimpleApp