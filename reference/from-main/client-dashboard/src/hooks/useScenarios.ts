import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Scenario } from '@/types'
import { addNotification } from '@/utils/notifications'

// Mock API functions - replace with actual API calls
const fetchScenarios = async (): Promise<Scenario[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock data
  return [
    {
      id: '1',
      name: 'Phishing Response Training',
      description: 'A comprehensive phishing simulation to test email security awareness',
      type: 'simulation',
      status: 'published',
      difficulty: 'intermediate',
      duration: 45,
      teamsRequired: 1,
      objectives: [
        'Identify phishing email indicators',
        'Follow proper reporting procedures',
        'Understand social engineering tactics'
      ],
      prerequisites: [
        'Basic email security training',
        'Understanding of company policies'
      ],
      tags: ['phishing', 'email', 'social engineering'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      createdBy: 'user1',
      phases: [],
      injects: [],
      assets: []
    },
    {
      id: '2',
      name: 'Incident Response Drill',
      description: 'Full-scale incident response exercise simulating a ransomware attack',
      type: 'tabletop',
      status: 'published',
      difficulty: 'advanced',
      duration: 120,
      teamsRequired: 3,
      objectives: [
        'Coordinate incident response teams',
        'Practice communication protocols',
        'Test recovery procedures'
      ],
      prerequisites: [
        'Incident response team certification',
        'Knowledge of NIST framework'
      ],
      tags: ['incident response', 'ransomware', 'coordination'],
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-25T16:45:00Z',
      createdBy: 'user2',
      phases: [],
      injects: [],
      assets: []
    },
    {
      id: '3',
      name: 'Network Security Assessment',
      description: 'Hands-on network penetration testing scenario',
      type: 'live_fire',
      status: 'draft',
      difficulty: 'expert',
      duration: 180,
      teamsRequired: 2,
      objectives: [
        'Identify network vulnerabilities',
        'Practice penetration testing techniques',
        'Document security findings'
      ],
      prerequisites: [
        'Advanced networking knowledge',
        'Penetration testing experience'
      ],
      tags: ['penetration testing', 'network security', 'vulnerability assessment'],
      createdAt: '2024-01-12T11:30:00Z',
      updatedAt: '2024-01-22T13:15:00Z',
      createdBy: 'user1',
      phases: [],
      injects: [],
      assets: []
    }
  ]
}

const createScenario = async (scenario: Partial<Scenario>): Promise<Scenario> => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const newScenario: Scenario = {
    id: Math.random().toString(36).substr(2, 9),
    name: scenario.name || '',
    description: scenario.description || '',
    type: scenario.type || 'simulation',
    status: scenario.status || 'draft',
    difficulty: scenario.difficulty || 'intermediate',
    duration: scenario.duration || 60,
    teamsRequired: scenario.teamsRequired || 1,
    objectives: scenario.objectives || [],
    prerequisites: scenario.prerequisites || [],
    tags: scenario.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current-user',
    phases: [],
    injects: [],
    assets: []
  }
  
  return newScenario
}

const updateScenario = async (id: string, scenario: Partial<Scenario>): Promise<Scenario> => {
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // In real implementation, this would update the scenario on the server
  return {
    ...scenario,
    id,
    updatedAt: new Date().toISOString()
  } as Scenario
}

const deleteScenario = async (id: string): Promise<void> => {
  console.log('Deleting scenario:', id)
  await new Promise(resolve => setTimeout(resolve, 500))
  // In real implementation, this would delete the scenario from the server
}

export const useScenarios = () => {
  const queryClient = useQueryClient()

  const {
    data: scenarios = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['scenarios'],
    queryFn: fetchScenarios,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const createMutation = useMutation({
    mutationFn: createScenario,
    onSuccess: (newScenario) => {
      queryClient.setQueryData(['scenarios'], (old: Scenario[] = []) => [
        ...old,
        newScenario
      ])
      addNotification({
        type: 'success',
        title: 'Scenario created',
        message: `"${newScenario.name}" has been created successfully`
      })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to create scenario',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, scenario }: { id: string; scenario: Partial<Scenario> }) =>
      updateScenario(id, scenario),
    onSuccess: (updatedScenario) => {
      queryClient.setQueryData(['scenarios'], (old: Scenario[] = []) =>
        old.map(scenario => 
          scenario.id === updatedScenario.id ? updatedScenario : scenario
        )
      )
      addNotification({
        type: 'success',
        title: 'Scenario updated',
        message: `"${updatedScenario.name}" has been updated successfully`
      })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to update scenario',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      // Refetch scenarios after deletion
      queryClient.invalidateQueries({ queryKey: ['scenarios'] })
      addNotification({
        type: 'success',
        title: 'Scenario deleted',
        message: 'Scenario has been deleted successfully'
      })
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'Failed to delete scenario',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
    }
  })

  const duplicateScenario = async (scenario: Scenario) => {
    const duplicatedScenario = {
      ...scenario,
      name: `${scenario.name} (Copy)`,
      status: 'draft' as const,
      id: undefined
    }
    
    return createMutation.mutateAsync(duplicatedScenario)
  }

  return {
    scenarios,
    isLoading,
    error,
    refetch,
    createScenario: createMutation.mutateAsync,
    updateScenario: (id: string, scenario: Partial<Scenario>) =>
      updateMutation.mutateAsync({ id, scenario }),
    deleteScenario: deleteMutation.mutateAsync,
    duplicateScenario,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}