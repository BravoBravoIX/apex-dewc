import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  message?: string
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
          {message}
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen