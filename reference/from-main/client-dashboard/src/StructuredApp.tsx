import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  PlayCircle, 
  Monitor, 
  BarChart3, 
  Users,
  Shield,
  LogOut,
  User,
  Bell,
  Search,
  Play, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  X,
  RefreshCw,
  ExternalLink
} from 'lucide-react'

// Sample Data
const sampleScenarios = [
  {
    id: '1',
    name: 'Advanced Persistent Threat Detection',
    description: 'Simulate a sophisticated APT attack targeting critical infrastructure',
    difficulty: 'Advanced',
    duration: 120,
    status: 'published' as const,
    teamsRequired: 3,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    organizationId: 'org-1',
    createdBy: 'user-1',
    tags: ['apt', 'infrastructure', 'detection'],
    objectives: [],
    steps: [],
    injects: [],
    metrics: []
  },
  {
    id: '2',
    name: 'Ransomware Response Exercise',
    description: 'Practice incident response procedures for ransomware attack',
    difficulty: 'Intermediate',
    duration: 90,
    status: 'published' as const,
    teamsRequired: 2,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T16:15:00Z',
    organizationId: 'org-1',
    createdBy: 'user-1',
    tags: ['ransomware', 'incident-response'],
    objectives: [],
    steps: [],
    injects: [],
    metrics: []
  },
  {
    id: '3',
    name: 'Phishing Campaign Simulation',
    description: 'Test user awareness and detection capabilities against phishing',
    difficulty: 'Beginner',
    duration: 60,
    status: 'draft' as const,
    teamsRequired: 1,
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-19T13:45:00Z',
    organizationId: 'org-1',
    createdBy: 'user-1',
    tags: ['phishing', 'awareness', 'email'],
    objectives: [],
    steps: [],
    injects: [],
    metrics: []
  }
]

// Sample Exercise Data
const sampleExercises = [
  {
    id: '1',
    name: 'APT Response Drill',
    scenarioId: '1',
    scenarioName: 'Advanced Persistent Threat Detection',
    status: 'active' as const,
    startTime: new Date().toISOString(),
    estimatedEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    participantCount: 15,
    teamsAssigned: ['Red Team', 'Blue Team', 'SOC Team']
  },
  {
    id: '2',
    name: 'Weekly Security Training',
    scenarioId: '3',
    scenarioName: 'Phishing Campaign Simulation',
    status: 'scheduled' as const,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    estimatedEnd: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
    participantCount: 8,
    teamsAssigned: ['Security Awareness Team']
  },
  {
    id: '3',
    name: 'Incident Response Exercise',
    scenarioId: '2',
    scenarioName: 'Ransomware Response Exercise',
    status: 'completed' as const,
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedEnd: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    participantCount: 12,
    teamsAssigned: ['Incident Response', 'IT Operations']
  }
]

// Team Configuration Interface
interface TeamConfig {
  team_id: string
  team_name: string
  team_color: string
  exercise_id: string
  organization_id: string
}

interface DashboardStatus {
  team_id: string
  container_id: string
  port: number
  status: string
  access_token: string
  url: string
  created_at: string
  exercise_id: string
}

// Exercise Operations Component
const ExerciseOperations = () => {
  const [exercises, setExercises] = useState(sampleExercises)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'active' | 'completed'>('all')
  const [teamConfigs, setTeamConfigs] = useState<TeamConfig[]>(() => {
    const saved = localStorage.getItem('scip-team-configs')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse saved team configs:', e)
      }
    }
    return [
      { team_id: 'red-team', team_name: 'Red Team', team_color: '#ef4444', exercise_id: '', organization_id: 'demo-org' },
      { team_id: 'blue-team', team_name: 'Blue Team', team_color: '#3b82f6', exercise_id: '', organization_id: 'demo-org' }
    ]
  })
  const [activeDashboards, setActiveDashboards] = useState<DashboardStatus[]>([])
  const [showTeamConfig, setShowTeamConfig] = useState(false)
  const [currentExercise, setCurrentExercise] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20'
      case 'active':
        return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'completed':
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
    }
  }

  const filteredExercises = exercises
    .filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.scenarioName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || exercise.status === statusFilter
      return matchesSearch && matchesStatus
    })

  const addTeam = () => {
    // Predefined distinct colors to avoid random red conflicts
    const predefinedColors = [
      '#10b981', // emerald
      '#8b5cf6', // violet
      '#f59e0b', // amber
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#ec4899', // pink
      '#6366f1', // indigo
      '#f97316', // orange
    ]
    
    // Select a color that's not already used
    const usedColors = teamConfigs.map(t => t.team_color.toLowerCase())
    const availableColors = predefinedColors.filter(color => !usedColors.includes(color.toLowerCase()))
    const selectedColor = availableColors.length > 0 
      ? availableColors[0] 
      : predefinedColors[teamConfigs.length % predefinedColors.length]
    
    const newTeam: TeamConfig = {
      team_id: `team-${teamConfigs.length + 1}`,
      team_name: `Team ${teamConfigs.length + 1}`,
      team_color: selectedColor,
      exercise_id: '',
      organization_id: 'demo-org'
    }
    
    console.log('Creating new team:', newTeam)
    
    const updated = [...teamConfigs, newTeam]
    setTeamConfigs(updated)
    localStorage.setItem('scip-team-configs', JSON.stringify(updated))
    
    console.log('Updated team configs:', updated)
  }

  const removeTeam = (index: number) => {
    if (teamConfigs.length > 1) {
      const updated = teamConfigs.filter((_, i) => i !== index)
      setTeamConfigs(updated)
      localStorage.setItem('scip-team-configs', JSON.stringify(updated))
    }
  }

  const updateTeam = (index: number, field: keyof TeamConfig, value: string) => {
    const updated = [...teamConfigs]
    updated[index] = { ...updated[index], [field]: value }
    setTeamConfigs(updated)
    localStorage.setItem('scip-team-configs', JSON.stringify(updated))
  }

  const resetTeamConfigurations = () => {
    if (confirm('Reset team configurations to defaults? This will clear all custom teams and settings.')) {
      const defaultTeams = [
        { team_id: 'red-team', team_name: 'Red Team', team_color: '#ef4444', exercise_id: '', organization_id: 'demo-org' },
        { team_id: 'blue-team', team_name: 'Blue Team', team_color: '#3b82f6', exercise_id: '', organization_id: 'demo-org' }
      ]
      
      console.log('Resetting team configurations to defaults:', defaultTeams)
      
      setTeamConfigs(defaultTeams)
      localStorage.setItem('scip-team-configs', JSON.stringify(defaultTeams))
      
      // Also clear any other dashboard-related localStorage
      localStorage.removeItem('team-dashboard-store')
      
      alert('Team configurations reset to defaults. Red Team and Blue Team are ready to use.')
    }
  }

  const refreshDashboardStatus = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/dashboards/list')
      if (response.ok) {
        const dashboards = await response.json()
        setActiveDashboards(dashboards)
        
        // Update current exercise based on active dashboards
        if (dashboards.length > 0) {
          const exerciseIds = [...new Set(dashboards.map(d => d.exercise_id))]
          if (exerciseIds.length === 1) {
            setCurrentExercise(exerciseIds[0])
          }
        } else {
          setCurrentExercise(null)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard status:', error)
    }
  }

  const cleanupAllDashboards = async () => {
    try {
      const response = await fetch('http://localhost:8001/api/v1/dashboards/list')
      if (response.ok) {
        const dashboards = await response.json()
        
        // Stop all exercises
        const exerciseIds = [...new Set(dashboards.map(d => d.exercise_id))]
        for (const exerciseId of exerciseIds) {
          await fetch(`http://localhost:8001/api/v1/dashboards/exercise/${exerciseId}`, {
            method: 'DELETE'
          })
        }
        
        alert(`Cleaned up all ${dashboards.length} active dashboards`)
        setActiveDashboards([])
        setCurrentExercise(null)
        refreshDashboardStatus()
      }
    } catch (error) {
      console.error('Error cleaning up dashboards:', error)
      alert('Failed to cleanup dashboards')
    }
  }

  const handleLaunchExercise = async (exerciseId: string) => {
    try {
      // Use configured teams
      const teamsForExercise = teamConfigs.map(team => ({
        ...team,
        exercise_id: exerciseId
      }))

      console.log('Launching exercise with teams:', teamsForExercise)

      // Deploy team dashboards via orchestration service
      const response = await fetch('http://localhost:8001/api/v1/dashboards/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_id: exerciseId,
          teams: teamsForExercise
        })
      });

      if (response.ok) {
        const deployedDashboards = await response.json();
        setActiveDashboards(deployedDashboards);
        setCurrentExercise(exerciseId);
        alert(`Successfully deployed ${deployedDashboards.length} team dashboards!\n` +
              deployedDashboards.map(d => `${d.team_id}: ${d.url}`).join('\n'));
        
        // Update exercise status to active
        setExercises(prev => prev.map(ex => 
          ex.id === exerciseId ? { ...ex, status: 'active' } : ex
        ));
        
        // Refresh dashboard status
        refreshDashboardStatus();
      } else {
        throw new Error('Failed to deploy dashboards');
      }
    } catch (error) {
      console.error('Error launching exercise:', error);
      alert('Failed to launch exercise. Please check the orchestration service.');
    }
  };

  const handleStopExercise = async (exerciseId: string) => {
    try {
      const response = await fetch(`http://localhost:8001/api/v1/dashboards/exercise/${exerciseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Exercise stopped. ${result.message}`);
        
        // Update exercise status to completed
        setExercises(prev => prev.map(ex => 
          ex.id === exerciseId ? { ...ex, status: 'completed' } : ex
        ));
        
        // Clear active dashboards for this exercise
        setActiveDashboards(prev => prev.filter(d => d.exercise_id !== exerciseId));
        setCurrentExercise(null);
        refreshDashboardStatus();
      } else {
        throw new Error('Failed to stop exercise');
      }
    } catch (error) {
      console.error('Error stopping exercise:', error);
      alert('Failed to stop exercise.');
    }
  };

  // Load dashboard status on component mount
  React.useEffect(() => {
    refreshDashboardStatus();
    const interval = setInterval(refreshDashboardStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exercise Operations</h1>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowTeamConfig(!showTeamConfig)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Configure Teams</span>
          </button>
          <button 
            onClick={resetTeamConfigurations}
            className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Teams</span>
          </button>
          {activeDashboards.length > 0 && (
            <button 
              onClick={cleanupAllDashboards}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cleanup All</span>
            </button>
          )}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Exercise</span>
          </button>
        </div>
      </div>

      {/* Exercise Status Banner */}
      {currentExercise && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-semibold">Exercise Running</div>
                <div className="text-sm">
                  Exercise ID: {currentExercise} | {activeDashboards.length} team{activeDashboards.length !== 1 ? 's' : ''} deployed
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleStopExercise(currentExercise)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Stop Exercise</span>
            </button>
          </div>
        </div>
      )}

      {!currentExercise && activeDashboards.length === 0 && (
        <div className="bg-blue-100 border border-blue-300 text-blue-800 px-6 py-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5" />
            <div>
              <div className="font-semibold">Ready to Deploy</div>
              <div className="text-sm">Configure your teams above, then select an exercise to launch team dashboards.</div>
            </div>
          </div>
        </div>
      )}

      {/* Team Configuration Panel */}
      {showTeamConfig && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Team Configuration</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Current teams: {teamConfigs.length} | Source: localStorage
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => {
                  console.log('Current team configs:', teamConfigs)
                  console.log('localStorage scip-team-configs:', localStorage.getItem('scip-team-configs'))
                  alert('Check browser console for current team configuration details')
                }}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              >
                Debug
              </button>
              <button 
                onClick={addTeam}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Team</span>
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {teamConfigs.map((team, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                <div className="flex items-center space-x-2 flex-1">
                  <div 
                    className="w-6 h-6 rounded border-2 border-white shadow-md"
                    style={{ backgroundColor: team.team_color }}
                    title={`Team color: ${team.team_color}`}
                  />
                  <input
                    type="text"
                    value={team.team_id}
                    onChange={(e) => updateTeam(index, 'team_id', e.target.value)}
                    placeholder="Team ID"
                    className="flex-1 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  value={team.team_name}
                  onChange={(e) => updateTeam(index, 'team_name', e.target.value)}
                  placeholder="Team Name"
                  className="flex-1 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <input
                  type="color"
                  value={team.team_color}
                  onChange={(e) => updateTeam(index, 'team_color', e.target.value)}
                  className="w-12 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
                  title="Click to change team color"
                />
                <button 
                  onClick={() => removeTeam(index)}
                  className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  disabled={teamConfigs.length <= 1}
                  title={teamConfigs.length <= 1 ? "Cannot remove - at least one team required" : "Remove team"}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Dashboards Status */}
      {activeDashboards.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Team Dashboards</h2>
            <button 
              onClick={refreshDashboardStatus}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDashboards.map((dashboard) => (
              <div key={dashboard.team_id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900 dark:text-white">{dashboard.team_id}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    dashboard.status === 'running' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {dashboard.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Port: {dashboard.port}</div>
                  <div>Container: {dashboard.container_id.substring(0, 12)}</div>
                  <div className="flex items-center space-x-2">
                    <span>URL:</span>
                    <a 
                      href={dashboard.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <span>{dashboard.url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'scheduled' | 'active' | 'completed')}
              className="pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          {filteredExercises.length} of {exercises.length} exercises
        </div>
      </div>

      {/* Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise) => (
          <div key={exercise.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {exercise.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {exercise.scenarioName}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(exercise.status)}`}>
                {exercise.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {exercise.status === 'scheduled' ? 'Starts:' : exercise.status === 'active' ? 'Started:' : 'Completed:'}
                  {' '}
                  {new Date(exercise.startTime).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <Users className="w-4 h-4 mr-2" />
                <span>{exercise.participantCount} participants</span>
              </div>

              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">Teams: </span>
                {exercise.teamsAssigned.join(', ')}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              {exercise.status === 'active' && (
                <button 
                  onClick={() => handleStopExercise(exercise.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  End Exercise
                </button>
              )}
              {exercise.status === 'scheduled' && (
                <button 
                  onClick={() => handleLaunchExercise(exercise.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Launch Now
                </button>
              )}
              {exercise.status === 'completed' && (
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  View Report
                </button>
              )}
              
              <div className="flex space-x-2">
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title="Monitor">
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-2">No exercises found</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters'
              : 'Create your first exercise to get started'
            }
          </div>
        </div>
      )}
    </div>
  )
}

// Scenario Management Component  
const ScenarioManagement = () => {
  const [scenarios, setScenarios] = useState(sampleScenarios)
  const [sortField, setSortField] = useState<'name' | 'status' | 'difficulty' | 'duration' | 'updatedAt'>('updatedAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')

  const handleSort = (field: 'name' | 'status' | 'difficulty' | 'duration' | 'updatedAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: 'name' | 'status' | 'difficulty' | 'duration' | 'updatedAt') => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
      case 'published':
        return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'archived':
        return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20'
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'intermediate':
        return 'text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20'
      case 'advanced':
        return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      default:
        return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800'
    }
  }

  // Filter and sort scenarios
  const filteredAndSortedScenarios = scenarios
    .filter(scenario => {
      const matchesSearch = scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           scenario.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || scenario.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (sortField === 'updatedAt') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scenario Management</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>New Scenario</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search scenarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published' | 'archived')}
              className="pl-10 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-slate-600 dark:text-slate-400">
          {filteredAndSortedScenarios.length} of {scenarios.length} scenarios
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => handleSort('difficulty')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Difficulty</span>
                    {getSortIcon('difficulty')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => handleSort('duration')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Duration</span>
                    {getSortIcon('duration')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Teams
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => handleSort('updatedAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Updated</span>
                    {getSortIcon('updatedAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {filteredAndSortedScenarios.map((scenario) => (
                <tr key={scenario.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {scenario.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {scenario.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scenario.status)}`}>
                      {scenario.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(scenario.difficulty)}`}>
                      {scenario.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{scenario.duration} min</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{scenario.teamsRequired}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {new Date(scenario.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {scenario.status === 'published' && (
                        <button
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Launch Exercise"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedScenarios.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="text-slate-400 mb-2">No scenarios found</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Create your first scenario to get started'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple Pages
const SimpleDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-sm text-slate-600">Active Exercises</h3>
        <p className="text-3xl font-bold text-slate-900">12</p>
      </div>
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-sm text-slate-600">Scenarios</h3>
        <p className="text-3xl font-bold text-slate-900">48</p>
      </div>
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-sm text-slate-600">Teams</h3>
        <p className="text-3xl font-bold text-slate-900">15</p>
      </div>
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-sm text-slate-600">Success Rate</h3>
        <p className="text-3xl font-bold text-slate-900">89%</p>
      </div>
    </div>
  </div>
)



const SimpleMonitor = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-6">Real-time Monitor</h1>
    <div className="bg-white p-6 rounded-lg border">
      <p className="text-slate-600">Live exercise monitoring with launch controls - complete</p>
    </div>
  </div>
)

const SimpleReports = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-6">Reports & Analytics</h1>
    <div className="bg-white p-6 rounded-lg border">
      <p className="text-slate-600">Performance reports and analytics dashboard</p>
    </div>
  </div>
)

const SimpleTeams = () => (
  <div>
    <h1 className="text-2xl font-bold text-slate-900 mb-6">Team Management</h1>
    <div className="bg-white p-6 rounded-lg border">
      <p className="text-slate-600">Team assignment and participant management</p>
    </div>
  </div>
)

// Layout Components
const Sidebar = () => {
  const location = useLocation()
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Scenario Management', path: '/scenarios' },
    { icon: PlayCircle, label: 'Exercise Operations', path: '/exercises' },
    { icon: Monitor, label: 'Real-time Monitor', path: '/monitor' },
    { icon: BarChart3, label: 'Reports & Analytics', path: '/reports' },
    { icon: Users, label: 'Team Management', path: '/teams' },
  ]

  return (
    <div className="w-64 bg-slate-800 text-slate-100">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">SCIP</h1>
            <p className="text-xs text-slate-400">Client Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center p-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

const TopBar = ({ user, onLogout }: { user: any, onLogout: () => void }) => (
  <header className="bg-white border-b border-slate-200 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search scenarios, exercises..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3 px-3 py-2 bg-slate-100 rounded-lg">
          <User className="w-6 h-6 text-slate-600" />
          <div>
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  </header>
)

const DashboardLayout = ({ user, onLogout }: { user: any, onLogout: () => void }) => (
  <div className="flex h-screen bg-slate-900">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-auto bg-slate-50 p-6">
        <Routes>
          <Route path="/dashboard" element={<SimpleDashboard />} />
          <Route path="/scenarios" element={<ScenarioManagement />} />
          <Route path="/exercises" element={<ExerciseOperations />} />
          <Route path="/monitor" element={<SimpleMonitor />} />
          <Route path="/reports" element={<SimpleReports />} />
          <Route path="/teams" element={<SimpleTeams />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  </div>
)

// Login Component
const LoginForm = ({ onLogin }: { onLogin: (email: string, password: string) => void }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onLogin(email, password)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to SCIP</h1>
          <p className="text-slate-600">Sign in to access your client dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Demo Mode: Use any email and password
        </p>
      </div>
    </div>
  )
}

// Main App
const StructuredApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  const handleLogin = (email: string, password: string) => {
    setUser({ name: 'Demo User', email })
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <Router>
      <DashboardLayout user={user} onLogout={handleLogout} />
    </Router>
  )
}

export default StructuredApp