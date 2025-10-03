import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Scenario, ScenarioType, ScenarioStatus } from '@/types'
import { X, Save, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface ScenarioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (scenario: Partial<Scenario>) => Promise<void>
  scenario?: Scenario
  mode: 'create' | 'edit' | 'duplicate'
}

interface ScenarioFormData {
  name: string
  description: string
  type: ScenarioType
  difficulty: string
  duration: number
  teamsRequired: number
  status: ScenarioStatus
  objectives: string
  prerequisites: string
  tags: string
}

const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  scenario,
  mode
}) => {
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ScenarioFormData>()

  useEffect(() => {
    if (isOpen && scenario && (mode === 'edit' || mode === 'duplicate')) {
      // Populate form with existing scenario data
      setValue('name', mode === 'duplicate' ? `${scenario.name} (Copy)` : scenario.name)
      setValue('description', scenario.description)
      setValue('type', scenario.type)
      setValue('difficulty', scenario.difficulty)
      setValue('duration', scenario.duration)
      setValue('teamsRequired', scenario.teamsRequired)
      setValue('status', mode === 'duplicate' ? 'draft' : scenario.status)
      setValue('objectives', scenario.objectives.join('\n'))
      setValue('prerequisites', scenario.prerequisites.join('\n'))
      setValue('tags', scenario.tags.join(', '))
    } else if (isOpen && mode === 'create') {
      // Reset form for new scenario
      reset({
        name: '',
        description: '',
        type: 'simulation',
        difficulty: 'intermediate',
        duration: 60,
        teamsRequired: 1,
        status: 'draft',
        objectives: '',
        prerequisites: '',
        tags: ''
      })
    }
  }, [isOpen, scenario, mode, setValue, reset])

  const onSubmit = async (data: ScenarioFormData) => {
    try {
      setIsLoading(true)
      
      const scenarioData: Partial<Scenario> = {
        ...data,
        objectives: data.objectives.split('\n').filter(obj => obj.trim()),
        prerequisites: data.prerequisites.split('\n').filter(prereq => prereq.trim()),
        tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        id: mode === 'create' || mode === 'duplicate' ? undefined : scenario?.id
      }

      await onSave(scenarioData)
      onClose()
    } catch (error) {
      console.error('Error saving scenario:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const title = mode === 'create' ? 'Create New Scenario' : 
                mode === 'edit' ? 'Edit Scenario' : 
                'Duplicate Scenario'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Scenario Name *
                </label>
                <input
                  {...register('name', { required: 'Scenario name is required' })}
                  type="text"
                  className={clsx(
                    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400',
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500'
                  )}
                  placeholder="Enter scenario name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type *
                </label>
                <select
                  {...register('type', { required: 'Type is required' })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500"
                >
                  <option value="simulation">Simulation</option>
                  <option value="tabletop">Tabletop Exercise</option>
                  <option value="live_fire">Live Fire</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Difficulty *
                </label>
                <select
                  {...register('difficulty', { required: 'Difficulty is required' })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  {...register('duration', { 
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1 minute' }
                  })}
                  type="number"
                  min="1"
                  className={clsx(
                    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white',
                    errors.duration ? 'border-red-300 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500'
                  )}
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.duration.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teams Required *
                </label>
                <input
                  {...register('teamsRequired', { 
                    required: 'Teams required is required',
                    min: { value: 1, message: 'At least 1 team is required' }
                  })}
                  type="number"
                  min="1"
                  className={clsx(
                    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white',
                    errors.teamsRequired ? 'border-red-300 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500'
                  )}
                />
                {errors.teamsRequired && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.teamsRequired.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                className={clsx(
                  'w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400',
                  errors.description ? 'border-red-300 focus:border-red-500' : 'border-slate-300 dark:border-slate-600 focus:border-blue-500'
                )}
                placeholder="Describe the scenario..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Objectives */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Learning Objectives
              </label>
              <textarea
                {...register('objectives')}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500"
                placeholder="Enter each objective on a new line..."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Enter each objective on a separate line
              </p>
            </div>

            {/* Prerequisites */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prerequisites
              </label>
              <textarea
                {...register('prerequisites')}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500"
                placeholder="Enter each prerequisite on a new line..."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Enter each prerequisite on a separate line
              </p>
            </div>

            {/* Tags and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tags
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-blue-500"
                  placeholder="phishing, social engineering, incident response..."
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Separate tags with commas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'btn-primary inline-flex items-center space-x-2',
                { 'opacity-50 cursor-not-allowed': isLoading }
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Scenario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ScenarioModal