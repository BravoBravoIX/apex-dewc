import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Edit3, BarChart3, Play, Pause, Square } from 'lucide-react';

interface Timeline {
  id: string;
  name: string;
  injects: any[];
}

interface Team {
  id: string;
  name: string;
  timeline_file: string;
  inject_count?: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  duration_minutes: number;
  teams: Team[];
}

interface Analytics {
  usage?: {
    total_deployments: number;
    average_duration_minutes: number;
    last_deployment?: string;
  };
}

interface ExerciseStatus {
  active: boolean;
  scenario_name: string;
  state: string;
  timer: {
    elapsed: number;
    formatted: string;
  };
  teams: Array<{
    id: string;
    delivered: number;
    total: number;
    status: string;
    url: string;
  }>;
  dashboard_urls?: {[key: string]: string};
}

const ScenarioWorkspacePage: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState<string>('');
  const [dashboardUrls, setDashboardUrls] = useState<{[key: string]: string} | null>(null);
  const [exerciseStatus, setExerciseStatus] = useState<ExerciseStatus | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  useEffect(() => {
    fetchScenarioData();
    fetchAnalytics();
    fetchCurrentExercise();
    const interval = setInterval(fetchCurrentExercise, 1000);
    return () => clearInterval(interval);
  }, [scenarioId]);

  const fetchScenarioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch full scenario details
      const scenarioRes = await fetch(`http://localhost:8001/api/v1/scenarios/${scenarioId}`);
      if (!scenarioRes.ok) {
        setError('Scenario not found');
        setLoading(false);
        return;
      }

      const foundScenario = await scenarioRes.json();
      console.log('Fetched scenario:', foundScenario);

      if (!foundScenario.teams || !Array.isArray(foundScenario.teams)) {
        console.error('Invalid scenario data:', foundScenario);
        setError('Invalid scenario data: teams not found');
        setLoading(false);
        return;
      }

      // Fetch inject counts for each team
      const teamsWithCounts = await Promise.all(
        foundScenario.teams.map(async (team: Team) => {
          try {
            const timelineRes = await fetch(
              `http://localhost:8001/api/v1/timelines/${scenarioId}/${team.id}`
            );
            if (timelineRes.ok) {
              const timelineData: Timeline = await timelineRes.json();
              return {
                ...team,
                inject_count: timelineData.injects?.length || 0
              };
            }
          } catch (err) {
            console.error(`Failed to fetch timeline for ${team.id}:`, err);
          }
          return { ...team, inject_count: 0 };
        })
      );

      setScenario({
        ...foundScenario,
        teams: teamsWithCounts
      });
    } catch (err) {
      console.error('Error in fetchScenarioData:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scenario');
      setScenario(null); // Ensure scenario is null on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`http://localhost:8001/api/v1/analytics/scenarios/${scenarioId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.log('Analytics not available (non-critical):', err);
      // Non-critical - don't show error
    }
  };

  const fetchCurrentExercise = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/exercises/current');
      const data = await response.json();
      if (data.active && data.scenario_name) {
        setRunningScenario(data.scenario_name);
        // Store full exercise status if this scenario is running
        if (data.scenario_name === scenarioId) {
          setExerciseStatus(data);
          // Build dashboard URLs from teams data
          const urls: {[key: string]: string} = {};
          data.teams?.forEach((team: any) => {
            urls[team.id] = team.url;
          });
          setDashboardUrls(urls);
        }
      } else {
        setRunningScenario(null);
        setDashboardUrls(null);
        setExerciseStatus(null);
      }
    } catch (error) {
      console.error('Error fetching current exercise:', error);
    }
  };

  const deployScenario = async () => {
    if (!scenarioId) return;
    setDeployStatus(`Deploying ${scenarioId}...`);
    setDashboardUrls(null);
    try {
      const response = await fetch(`http://localhost:8001/api/v1/exercises/${scenarioId}/deploy`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setDeployStatus(`Successfully deployed ${scenarioId}`);
        if (data.dashboard_urls) {
          setDashboardUrls(data.dashboard_urls);
        }
        fetchCurrentExercise();
        fetchAnalytics(); // Refresh analytics after deployment
      } else {
        setDeployStatus(`Error deploying ${scenarioId}: ${data.detail}`);
      }
    } catch (error) {
      setDeployStatus(`Failed to connect to orchestration service.`);
      console.error("There was an error deploying the scenario:", error);
    }
  };

  const startScenario = async () => {
    if (!scenarioId) return;
    try {
      const response = await fetch(`http://localhost:8001/api/v1/exercises/${scenarioId}/start`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchCurrentExercise();
      }
    } catch (error) {
      console.error("Error starting scenario:", error);
    }
  };

  const pauseScenario = async () => {
    if (!scenarioId) return;
    try {
      const response = await fetch(`http://localhost:8001/api/v1/exercises/${scenarioId}/pause`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchCurrentExercise();
      }
    } catch (error) {
      console.error("Error pausing scenario:", error);
    }
  };

  const finishScenario = async () => {
    if (!scenarioId) return;
    setShowStopConfirm(false);
    setDeployStatus(`Finishing ${scenarioId}...`);
    try {
      const response = await fetch(`http://localhost:8001/api/v1/exercises/${scenarioId}/finish`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setDeployStatus(`Exercise finished. Dashboards remain active.`);
        fetchCurrentExercise();
        fetchAnalytics(); // Refresh analytics
      } else {
        setDeployStatus(`Error finishing ${scenarioId}: ${data.detail || data.status}`);
      }
    } catch (error) {
      setDeployStatus(`Failed to connect to orchestration service.`);
      console.error("Error finishing scenario:", error);
    }
  };

  const stopScenario = async () => {
    if (!scenarioId) return;
    setDeployStatus(`Tearing down ${scenarioId}...`);
    setDashboardUrls(null);
    try {
      const response = await fetch(`http://localhost:8001/api/v1/exercises/${scenarioId}/stop`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setDeployStatus(`Successfully stopped and tore down ${scenarioId}`);
        fetchCurrentExercise();
      } else {
        setDeployStatus(`Error stopping ${scenarioId}: ${data.detail}`);
      }
    } catch (error) {
      setDeployStatus(`Failed to connect to orchestration service.`);
      console.error("There was an error stopping the scenario:", error);
    }
  };

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading scenario...</div>
      </div>
    );
  }

  if (error || !scenario || !scenario.teams) {
    return (
      <div>
        <Link to="/scenarios" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
          <ChevronLeft size={16} />
          Back to Scenarios
        </Link>
        <div className="card p-6 bg-red-500/10 border border-red-500/30">
          <p className="text-red-400">{error || 'Scenario not found or invalid'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/scenarios" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
          <ChevronLeft size={16} />
          Back to Scenarios
        </Link>

        <div className="card p-6">
          <div className="flex gap-6 items-start">
            {/* Thumbnail */}
            {scenario.thumbnail && (
              <div className="flex-shrink-0">
                <img
                  src={`http://localhost:8001/scenarios/${scenario.thumbnail}`}
                  alt={scenario.name}
                  className="w-48 h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Scenario Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {scenario.name}
              </h1>
              <p className="text-text-secondary mb-4">
                {scenario.description}
              </p>
              <div className="flex gap-6 text-sm text-text-secondary mb-4">
                <div>
                  <span className="font-semibold">Duration:</span> {scenario.duration_minutes} minutes
                </div>
                <div>
                  <span className="font-semibold">Teams:</span> {scenario.teams?.length || 0}
                </div>
              </div>

              {/* Deploy/Stop Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={deployScenario}
                  className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={runningScenario !== null}
                >
                  Deploy Exercise
                </button>
                <button
                  onClick={stopScenario}
                  className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={runningScenario !== scenarioId}
                >
                  End Exercise
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deploy Status */}
      {deployStatus && (
        <div className="mb-6 card p-4 bg-surface">
          <p className="text-text-primary">{deployStatus}</p>
        </div>
      )}

      {/* Dashboard URLs - Polished Design */}
      {dashboardUrls && runningScenario === scenarioId && (
        <div className="mb-6 card p-6 bg-surface-light">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Team Dashboards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dashboardUrls).map(([teamId, url]) => (
              <a
                key={teamId}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                  teamId === 'blue'
                    ? 'bg-blue-900/20 border-blue-500 hover:bg-blue-900/30'
                    : teamId === 'red'
                    ? 'bg-red-900/20 border-red-500 hover:bg-red-900/30'
                    : 'bg-gray-900/20 border-gray-500 hover:bg-gray-900/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    teamId === 'blue' ? 'bg-blue-500' :
                    teamId === 'red' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="font-semibold text-text-primary">
                    {teamId.charAt(0).toUpperCase() + teamId.slice(1)} Team
                  </span>
                </div>
                <span className="text-sm text-text-secondary">Open →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Control Panel */}
      {exerciseStatus && runningScenario === scenarioId && (
        <div className="mb-6 card p-6 bg-green-900/10 border border-green-500/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <h3 className="text-lg font-semibold text-text-primary">Exercise Active</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                exerciseStatus.state === 'RUNNING' ? 'bg-green-500/20 text-green-400' :
                exerciseStatus.state === 'PAUSED' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {exerciseStatus.state}
              </span>
            </div>
            <div className="text-2xl font-mono text-primary">
              {exerciseStatus.timer.formatted}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={startScenario}
              disabled={exerciseStatus.state === 'RUNNING' || exerciseStatus.state === 'FINISHED'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} />
              Start
            </button>
            <button
              onClick={pauseScenario}
              disabled={exerciseStatus.state !== 'RUNNING'}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pause size={16} />
              Pause
            </button>
            <button
              onClick={() => setShowStopConfirm(true)}
              disabled={exerciseStatus.state === 'FINISHED'}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square size={16} />
              Finish
            </button>
            <button
              onClick={stopScenario}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              End Exercise
            </button>
          </div>

          {/* Confirmation Dialog */}
          {showStopConfirm && (
            <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded">
              <p className="text-yellow-400 mb-3">
                Are you sure you want to finish this exercise? The timer will stop but dashboards will remain active.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={finishScenario}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded"
                >
                  Yes, Finish
                </button>
                <button
                  onClick={() => setShowStopConfirm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Inject Progress */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-secondary">Inject Progress</h4>
            {exerciseStatus.teams?.map((team) => (
              <div key={team.id} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-primary capitalize">{team.id} Team</span>
                  <span className="text-text-secondary">
                    {team.delivered} / {team.total} delivered
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      team.id === 'blue' ? 'bg-blue-500' :
                      team.id === 'red' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${team.total > 0 ? (team.delivered / team.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics */}
      {analytics?.usage && analytics.usage.total_deployments > 0 && (
        <div className="card p-4 mb-6 bg-surface-light">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="font-semibold text-text-primary">Usage Statistics</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Deployments</p>
              <p className="text-2xl font-bold text-primary">
                {analytics.usage.total_deployments}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Avg Duration</p>
              <p className="text-2xl font-bold text-primary">
                {analytics.usage.average_duration_minutes || 0}m
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Last Used</p>
              <p className="text-sm font-semibold text-text-primary">
                {formatLastUsed(analytics.usage.last_deployment)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Teams & Timelines */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Teams & Timelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenario.teams?.map((team) => (
            <div key={team.id} className="card p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary capitalize">
                    {team.name}
                  </h3>
                  <p className="text-sm text-text-secondary mt-1">
                    {team.inject_count !== undefined ? team.inject_count : '...'} inject{team.inject_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  team.id === 'blue' ? 'bg-blue-500' :
                  team.id === 'red' ? 'bg-red-500' :
                  'bg-gray-500'
                }`} />
              </div>

              {runningScenario === scenarioId ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-gray-400 rounded cursor-not-allowed justify-center">
                  <Edit3 size={16} />
                  <span>Timeline Locked</span>
                </div>
              ) : (
                <Link
                  to={`/timelines/${scenarioId}/${team.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded hover:bg-primary/80 transition-colors justify-center"
                >
                  <Edit3 size={16} />
                  Edit Timeline
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-4 bg-surface-light">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold">Tip:</span> Click "Edit Timeline" to manage injects for each team.
          Deploy the exercise from the Scenarios page when ready.
        </p>
      </div>
    </div>
  );
};

export default ScenarioWorkspacePage;
