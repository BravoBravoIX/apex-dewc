import React, { useState } from 'react'
import { Exercise, Scenario, Team } from '@/types'
import { ChevronLeft, ChevronRight, Check, Play, Users, Calendar, Settings } from 'lucide-react'
import { clsx } from 'clsx'

interface ExerciseWizardProps {
  isOpen: boolean
  onClose: () => void
  onSave: (exercise: Partial<Exercise>) => Promise<void>
  scenarios: Scenario[]
  teams: Team[]
}

type WizardStep = 'scenario' | 'configuration' | 'teams' | 'schedule' | 'review'

interface WizardData {
  scenarioId: string
  name: string
  description: string
  scheduledStart?: string
  duration: number
  selectedTeams: string[]
  settings: {
    allowLateJoin: boolean
    autoStart: boolean
    recordSession: boolean
    enableChat: boolean
  }
}

const ExerciseWizard: React.FC<ExerciseWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  scenarios,
  teams
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('scenario')
  const [isLoading, setIsLoading] = useState(false)
  const [wizardData, setWizardData] = useState<WizardData>({
    scenarioId: '',
    name: '',
    description: '',
    duration: 60,
    selectedTeams: [],
    settings: {
      allowLateJoin: true,
      autoStart: false,
      recordSession: true,
      enableChat: true
    }
  })

  const steps: Array<{ id: WizardStep; title: string; icon: React.ReactNode }> = [
    { id: 'scenario', title: 'Select Scenario', icon: <Settings className="w-5 h-5" /> },
    { id: 'configuration', title: 'Configure Exercise', icon: <Settings className="w-5 h-5" /> },
    { id: 'teams', title: 'Assign Teams', icon: <Users className="w-5 h-5" /> },
    { id: 'schedule', title: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
    { id: 'review', title: 'Review & Launch', icon: <Check className="w-5 h-5" /> }
  ]

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep)
  const isLastStep = getCurrentStepIndex() === steps.length - 1
  const isFirstStep = getCurrentStepIndex() === 0

  const canProceed = () => {
    switch (currentStep) {
      case 'scenario':
        return wizardData.scenarioId !== ''
      case 'configuration':
        return wizardData.name.trim() !== ''
      case 'teams':
        return wizardData.selectedTeams.length > 0
      case 'schedule':
        return true // Optional step
      case 'review':
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canProceed()) return
    
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    const currentIndex = getCurrentStepIndex()
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return

    try {
      setIsLoading(true)
      
      const selectedScenario = scenarios.find(s => s.id === wizardData.scenarioId)
      
      const exerciseData: Partial<Exercise> = {
        name: wizardData.name,
        description: wizardData.description,
        scenarioId: wizardData.scenarioId,
        scenario: selectedScenario,
        status: 'configured',
        scheduledStart: wizardData.scheduledStart,
        duration: wizardData.duration,
        assignedTeams: wizardData.selectedTeams,
        settings: wizardData.settings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await onSave(exerciseData)
      onClose()
    } catch (error) {
      console.error('Error creating exercise:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateWizardData = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }))
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'scenario':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Select a Scenario
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Choose the scenario you want to run for this exercise
            </p>
            
            <div className="grid gap-4">
              {scenarios.filter(s => s.status === 'published').map((scenario) => (
                <div
                  key={scenario.id}
                  className={clsx(
                    'p-4 border-2 rounded-lg cursor-pointer transition-all',
                    wizardData.scenarioId === scenario.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                  onClick={() => updateWizardData({ scenarioId: scenario.id })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {scenario.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {scenario.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-slate-500">
                          {scenario.duration} min
                        </span>
                        <span className="text-xs text-slate-500">
                          {scenario.teamsRequired} teams required
                        </span>
                        <span className={clsx(
                          'text-xs px-2 py-1 rounded-full',
                          scenario.difficulty === 'beginner' && 'bg-green-100 text-green-700',
                          scenario.difficulty === 'intermediate' && 'bg-amber-100 text-amber-700',
                          scenario.difficulty === 'advanced' && 'bg-red-100 text-red-700'
                        )}>
                          {scenario.difficulty}
                        </span>
                      </div>
                    </div>
                    {wizardData.scenarioId === scenario.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'configuration':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Configure Exercise
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Set up the basic configuration for your exercise
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Exercise Name *</label>
                <input
                  type="text"
                  value={wizardData.name}
                  onChange={(e) => updateWizardData({ name: e.target.value })}
                  className="form-input"
                  placeholder="Enter exercise name"
                />
              </div>
              
              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={wizardData.description}
                  onChange={(e) => updateWizardData({ description: e.target.value })}
                  rows={3}
                  className="form-input"
                  placeholder="Describe the exercise objectives and goals"
                />
              </div>
              
              <div>
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  value={wizardData.duration}
                  onChange={(e) => updateWizardData({ duration: parseInt(e.target.value) || 60 })}
                  min="1"
                  className="form-input"
                />
              </div>
              
              <div className="space-y-3">
                <label className="form-label">Exercise Settings</label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={wizardData.settings.allowLateJoin}
                    onChange={(e) => updateWizardData({
                      settings: { ...wizardData.settings, allowLateJoin: e.target.checked }
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Allow participants to join after exercise starts
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={wizardData.settings.autoStart}
                    onChange={(e) => updateWizardData({
                      settings: { ...wizardData.settings, autoStart: e.target.checked }
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Start exercise automatically at scheduled time
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={wizardData.settings.recordSession}
                    onChange={(e) => updateWizardData({
                      settings: { ...wizardData.settings, recordSession: e.target.checked }
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Record exercise session for review
                  </span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={wizardData.settings.enableChat}
                    onChange={(e) => updateWizardData({
                      settings: { ...wizardData.settings, enableChat: e.target.checked }
                    })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Enable team chat during exercise
                  </span>
                </label>
              </div>
            </div>
          </div>
        )

      case 'teams':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Assign Teams
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Select which teams will participate in this exercise
              </p>
            </div>
            
            <div className="grid gap-3">
              {teams.map((team) => (
                <label
                  key={team.id}
                  className={clsx(
                    'flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors',
                    wizardData.selectedTeams.includes(team.id)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={wizardData.selectedTeams.includes(team.id)}
                    onChange={(e) => {
                      const selectedTeams = e.target.checked
                        ? [...wizardData.selectedTeams, team.id]
                        : wizardData.selectedTeams.filter(id => id !== team.id)
                      updateWizardData({ selectedTeams })
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {team.name}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {team.members?.length || 0} members
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )

      case 'schedule':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Schedule Exercise
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Set when the exercise should start (optional)
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  value={wizardData.scheduledStart || ''}
                  onChange={(e) => updateWizardData({ scheduledStart: e.target.value })}
                  className="form-input"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-sm text-slate-500 mt-1">
                  Leave empty to start manually
                </p>
              </div>
            </div>
          </div>
        )

      case 'review':
        const selectedScenario = scenarios.find(s => s.id === wizardData.scenarioId)
        const selectedTeamsData = teams.filter(t => wizardData.selectedTeams.includes(t.id))
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Review & Launch Exercise
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Review all settings before creating the exercise
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="card">
                <div className="card-header">
                  <h4 className="font-medium text-slate-900 dark:text-white">Exercise Details</h4>
                </div>
                <div className="card-content space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Name:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{wizardData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Duration:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{wizardData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Scenario:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{selectedScenario?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Teams:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{selectedTeamsData.length} selected</span>
                  </div>
                  {wizardData.scheduledStart && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Scheduled:</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {new Date(wizardData.scheduledStart).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header with Steps */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Create New Exercise
          </h2>
          
          {/* Step Progress */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={clsx(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors',
                  currentStep === step.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : index < getCurrentStepIndex()
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'text-slate-500 dark:text-slate-400'
                )}>
                  {step.icon}
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={clsx(
                'btn-secondary inline-flex items-center space-x-2',
                { 'opacity-50 cursor-not-allowed': isFirstStep }
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            
            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className={clsx(
                  'btn-primary inline-flex items-center space-x-2',
                  { 'opacity-50 cursor-not-allowed': !canProceed() || isLoading }
                )}
              >
                <Play className="w-4 h-4" />
                <span>{isLoading ? 'Creating...' : 'Create Exercise'}</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={clsx(
                  'btn-primary inline-flex items-center space-x-2',
                  { 'opacity-50 cursor-not-allowed': !canProceed() }
                )}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseWizard