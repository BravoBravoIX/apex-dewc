import React, { useState } from 'react'
import { Exercise, ExerciseStatus } from '@/types'
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Settings
} from 'lucide-react'
import { clsx } from 'clsx'

interface LaunchControlProps {
  exercise: Exercise
  onStatusChange: (exerciseId: string, status: ExerciseStatus) => void
  onSettingsChange: (exerciseId: string, settings: Record<string, unknown>) => void
}

interface PreLaunchChecklist {
  id: string
  title: string
  description: string
  status: 'pending' | 'checking' | 'passed' | 'failed'
  required: boolean
}

const LaunchControl: React.FC<LaunchControlProps> = ({
  exercise,
  onStatusChange,
  onSettingsChange
}) => {
  const [checklist, setChecklist] = useState<PreLaunchChecklist[]>([
    {
      id: 'scenario-ready',
      title: 'Scenario Configuration',
      description: 'Verify scenario is properly configured and all assets are available',
      status: 'passed',
      required: true
    },
    {
      id: 'teams-assigned',
      title: 'Team Assignments',
      description: 'Confirm all required teams are assigned and participants are available',
      status: 'passed',
      required: true
    },
    {
      id: 'infrastructure',
      title: 'Infrastructure Ready',
      description: 'Check that all technical infrastructure and systems are operational',
      status: 'checking',
      required: true
    },
    {
      id: 'monitoring',
      title: 'Monitoring Systems',
      description: 'Verify real-time monitoring and logging systems are active',
      status: 'passed',
      required: true
    },
    {
      id: 'communications',
      title: 'Communication Channels',
      description: 'Test team chat and coordination channels are working',
      status: 'pending',
      required: false
    }
  ])

  const [launchSettings, setLaunchSettings] = useState({
    countdown: 10,
    notifyTeams: true,
    recordSession: true,
    enableChat: true,
    autoStart: false
  })

  const getStatusColor = (status: ExerciseStatus) => {
    switch (status) {
      case 'configured':
        return 'text-slate-600 bg-slate-100'
      case 'ready':
        return 'text-blue-700 bg-blue-100'
      case 'running':
        return 'text-green-700 bg-green-100'
      case 'paused':
        return 'text-amber-700 bg-amber-100'
      case 'completed':
        return 'text-green-700 bg-green-100'
      case 'cancelled':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  const getChecklistIcon = (status: PreLaunchChecklist['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'checking':
        return <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  const canLaunch = () => {
    return checklist
      .filter(item => item.required)
      .every(item => item.status === 'passed')
  }

  const handleLaunch = () => {
    if (!canLaunch()) return
    
    // Start countdown or immediate launch
    if (launchSettings.countdown > 0) {
      // In real implementation, this would start a countdown
      setTimeout(() => {
        onStatusChange(exercise.id, 'running')
      }, launchSettings.countdown * 1000)
      onStatusChange(exercise.id, 'ready')
    } else {
      onStatusChange(exercise.id, 'running')
    }
  }

  const handlePause = () => {
    onStatusChange(exercise.id, 'paused')
  }

  const handleResume = () => {
    onStatusChange(exercise.id, 'running')
  }

  const handleStop = () => {
    if (window.confirm('Are you sure you want to stop this exercise? This action cannot be undone.')) {
      onStatusChange(exercise.id, 'completed')
    }
  }

  const handleRunCheck = (checkId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === checkId 
        ? { ...item, status: 'checking' }
        : item
    ))

    // Simulate check process
    setTimeout(() => {
      setChecklist(prev => prev.map(item => 
        item.id === checkId 
          ? { ...item, status: Math.random() > 0.1 ? 'passed' : 'failed' }
          : item
      ))
    }, 2000)
  }

  const renderControls = () => {
    switch (exercise.status) {
      case 'configured':
        return (
          <div className="space-y-6">
            {/* Pre-launch Checklist */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Pre-Launch Checklist
              </h3>
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={clsx(
                      'flex items-center justify-between p-4 border rounded-lg',
                      item.status === 'passed' && 'border-green-200 bg-green-50',
                      item.status === 'failed' && 'border-red-200 bg-red-50',
                      item.status === 'checking' && 'border-blue-200 bg-blue-50',
                      item.status === 'pending' && 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {getChecklistIcon(item.status)}
                      <div>
                        <h4 className="font-medium text-slate-900">
                          {item.title}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleRunCheck(item.id)}
                        className="btn-secondary text-sm"
                      >
                        Run Check
                      </button>
                    )}
                    
                    {item.status === 'failed' && (
                      <button
                        onClick={() => handleRunCheck(item.id)}
                        className="btn-secondary text-sm"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Settings */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Launch Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Countdown Timer (seconds)
                  </label>
                  <input
                    type="number"
                    value={launchSettings.countdown}
                    onChange={(e) => setLaunchSettings(prev => ({
                      ...prev,
                      countdown: parseInt(e.target.value) || 0
                    }))}
                    min="0"
                    max="300"
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={launchSettings.notifyTeams}
                      onChange={(e) => setLaunchSettings(prev => ({
                        ...prev,
                        notifyTeams: e.target.checked
                      }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Notify teams before launch</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={launchSettings.recordSession}
                      onChange={(e) => setLaunchSettings(prev => ({
                        ...prev,
                        recordSession: e.target.checked
                      }))}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">Record exercise session</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {!canLaunch() && (
                  <p className="text-sm text-amber-600">
                    Complete all required checks before launching
                  </p>
                )}
              </div>
              <button
                onClick={handleLaunch}
                disabled={!canLaunch()}
                className={clsx(
                  'btn-primary inline-flex items-center space-x-2 px-6 py-3 text-lg',
                  !canLaunch() && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Play className="w-5 h-5" />
                <span>Launch Exercise</span>
              </button>
            </div>
          </div>
        )

      case 'ready':
        return (
          <div className="text-center py-12">
            <div className="mb-6">
              <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Exercise Starting Soon
              </h3>
              <p className="text-slate-600">
                Countdown in progress... Exercise will begin automatically.
              </p>
            </div>
            
            <div className="space-x-3">
              <button
                onClick={() => onStatusChange(exercise.id, 'running')}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Now</span>
              </button>
              <button
                onClick={() => onStatusChange(exercise.id, 'configured')}
                className="btn-secondary"
              >
                Cancel Launch
              </button>
            </div>
          </div>
        )

      case 'running':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Activity className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Exercise Running
              </h3>
              <p className="text-slate-600">
                Monitor team progress and exercise metrics in real-time.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-slate-900">45:32</div>
                <div className="text-sm text-slate-600">Elapsed Time</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-green-900">12/15</div>
                <div className="text-sm text-green-700">Active Participants</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-blue-900">7</div>
                <div className="text-sm text-blue-700">Events Triggered</div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3">
              <button
                onClick={handlePause}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
              <button
                onClick={handleStop}
                className="btn-danger inline-flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop Exercise</span>
              </button>
            </div>
          </div>
        )

      case 'paused':
        return (
          <div className="text-center py-12">
            <Pause className="w-16 h-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Exercise Paused
            </h3>
            <p className="text-slate-600 mb-6">
              The exercise is temporarily paused. Teams have been notified.
            </p>
            
            <div className="space-x-3">
              <button
                onClick={handleResume}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Resume</span>
              </button>
              <button
                onClick={handleStop}
                className="btn-danger inline-flex items-center space-x-2"
              >
                <Square className="w-4 h-4" />
                <span>Stop Exercise</span>
              </button>
            </div>
          </div>
        )

      case 'completed':
        return (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Exercise Completed
            </h3>
            <p className="text-slate-600 mb-6">
              The exercise has finished successfully. Reports and analytics are being generated.
            </p>
            
            <button className="btn-primary">
              View Results
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Exercise Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {exercise.name}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {exercise.description}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={clsx(
            'px-3 py-1 rounded-full text-sm font-medium',
            getStatusColor(exercise.status)
          )}>
            {exercise.status}
          </span>
          
          <button className="btn-secondary inline-flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Exercise Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">Scenario</div>
          <div className="font-medium text-slate-900 dark:text-white">
            {exercise.scenario?.name || 'Unknown'}
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">Duration</div>
          <div className="font-medium text-slate-900 dark:text-white">
            {exercise.duration} minutes
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">Teams</div>
          <div className="font-medium text-slate-900 dark:text-white">
            {exercise.assignedTeams?.length || 0} assigned
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400">Scheduled</div>
          <div className="font-medium text-slate-900 dark:text-white">
            {exercise.scheduledStart 
              ? new Date(exercise.scheduledStart).toLocaleString()
              : 'Manual start'
            }
          </div>
        </div>
      </div>

      {/* Main Control Area */}
      <div className="card">
        <div className="card-content">
          {renderControls()}
        </div>
      </div>
    </div>
  )
}

export default LaunchControl