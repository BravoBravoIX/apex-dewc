import React from 'react'

const TestApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          SCIP Client Dashboard Test
        </h1>
        <p className="text-slate-600 mb-8">
          If you can see this, the React app is working correctly.
        </p>
        <div className="space-y-4">
          <button className="btn-primary">
            Primary Button Test
          </button>
          <br />
          <button className="btn-secondary">
            Secondary Button Test
          </button>
        </div>
        <div className="mt-8">
          <div className="card max-w-md mx-auto">
            <div className="card-header">
              <h3 className="card-title">Test Card</h3>
            </div>
            <div className="card-content">
              <p className="text-slate-600">
                This is a test card to verify CSS is loading correctly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestApp