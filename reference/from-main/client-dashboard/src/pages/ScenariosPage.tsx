import React, { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useScenarios } from '@/hooks/useScenarios'
import { Scenario } from '@/types'
import ScenarioTable from '@/components/scenarios/ScenarioTable'
import ScenarioModal from '@/components/scenarios/ScenarioModal'
import LoadingScreen from '@/components/common/LoadingScreen'

const ScenariosPage: React.FC = () => {
  const {
    scenarios,
    isLoading,
    error,
    refetch,
    createScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario
  } = useScenarios()

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    mode: 'create' | 'edit'
    scenario?: Scenario
  }>({
    isOpen: false,
    mode: 'create'
  })

  const handleCreateNew = () => {
    setModalState({
      isOpen: true,
      mode: 'create'
    })
  }

  const handleEdit = (scenario: Scenario) => {
    setModalState({
      isOpen: true,
      mode: 'edit',
      scenario
    })
  }

  const handleDuplicate = async (scenario: Scenario) => {
    await duplicateScenario(scenario)
  }

  const handleDelete = async (scenario: Scenario) => {
    if (window.confirm(`Are you sure you want to delete "${scenario.name}"? This action cannot be undone.`)) {
      await deleteScenario(scenario.id)
    }
  }

  const handlePreview = (scenario: Scenario) => {
    // TODO: Implement scenario preview
    console.log('Preview scenario:', scenario)
  }

  const handleLaunch = (scenario: Scenario) => {
    // TODO: Navigate to exercise configuration with this scenario
    console.log('Launch scenario:', scenario)
  }

  const handleModalSave = async (scenarioData: Partial<Scenario>) => {
    if (modalState.mode === 'create') {
      await createScenario(scenarioData)
    } else if (modalState.mode === 'edit' && modalState.scenario) {
      await updateScenario(modalState.scenario.id, scenarioData)
    }
  }

  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'create'
    })
  }

  if (isLoading) {
    return <LoadingScreen message="Loading scenarios..." />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scenarios</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage and configure exercise scenarios
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Failed to load scenarios
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => refetch()}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scenarios</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and configure exercise scenarios
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="btn-secondary inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Scenario</span>
          </button>
        </div>
      </div>

      <ScenarioTable
        scenarios={scenarios}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onPreview={handlePreview}
        onLaunch={handleLaunch}
      />

      <ScenarioModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSave={handleModalSave}
        scenario={modalState.scenario}
        mode={modalState.mode}
      />
    </div>
  )
}

export default ScenariosPage