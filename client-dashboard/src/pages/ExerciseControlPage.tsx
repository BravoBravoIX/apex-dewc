import { useState, useEffect } from 'react';

interface ExerciseStatus {
  state: 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'STOPPED';
  timer: {
    formatted: string;
    elapsed: number;
  };
  teams: Array<{
    id: string;
    delivered: number;
    total: number;
    status: string;
    port: string;
    url: string;
  }>;
  scenario_name?: string;
  thumbnail?: string;
}

const ExerciseControlPage = () => {
  const [status, setStatus] = useState<ExerciseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean>(true);

  useEffect(() => {
    // Poll status every second
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/v1/exercises/current');
        const data = await res.json();

        setApiConnected(true);
        if (data.active) {
          // Force a new object reference to ensure React re-renders
          setStatus({...data});
          setError(null);
        } else {
          setStatus(null);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
        setApiConnected(false);
        setError('Failed to connect to orchestration service');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (!status?.scenario_name) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/api/v1/exercises/${status.scenario_name}/start`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Failed to start exercise');
      }
    } catch (error) {
      console.error('Failed to start:', error);
      setError('Failed to start exercise');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!status?.scenario_name) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/api/v1/exercises/${status.scenario_name}/pause`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Failed to pause exercise');
      }
    } catch (error) {
      console.error('Failed to pause:', error);
      setError('Failed to pause exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!status?.scenario_name) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/api/v1/exercises/${status.scenario_name}/resume`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Failed to resume exercise');
      }
    } catch (error) {
      console.error('Failed to resume:', error);
      setError('Failed to resume exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!status?.scenario_name) return;
    if (!window.confirm('Are you sure you want to stop the exercise? This will remove all team dashboards.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/api/v1/exercises/${status.scenario_name}/stop`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Failed to stop exercise');
      }
    } catch (error) {
      console.error('Failed to stop:', error);
      setError('Failed to stop exercise');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Exercise Control</h2>
        <div className="card p-6 bg-red-900/20 border border-red-500">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Exercise Control</h2>
        <div className="card p-6">
          <p className="text-text-secondary">No active exercise. Start one from the Scenarios page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {status.thumbnail && (
            <img
              src={`http://localhost:8001${status.thumbnail}`}
              alt="Scenario thumbnail"
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <h2 className="text-2xl font-bold">
            Exercise Control - {status.scenario_name?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${
            apiConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></span>
          <span className={`text-sm ${apiConnected ? 'text-green-500' : 'text-red-500'}`}>
            {apiConnected ? 'API Connected' : 'API Disconnected'}
          </span>
        </div>
      </div>

      {/* Timer Display */}
      <div className="card p-6 mb-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2 font-mono">
            {status.timer.formatted}
          </div>
          <div className="text-text-secondary">
            Status: <span className={`font-semibold ${
              status.state === 'RUNNING' ? 'text-green-500' :
              status.state === 'PAUSED' ? 'text-yellow-500' :
              'text-red-500'
            }`}>{status.state}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="card p-4 mb-4">
        <div className="flex gap-2 justify-center">
          {status.state === 'NOT_STARTED' && (
            <button
              onClick={handleStart}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶ Start Exercise
            </button>
          )}
          {status.state === 'RUNNING' && (
            <button
              onClick={handlePause}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏸ Pause
            </button>
          )}
          {status.state === 'PAUSED' && (
            <button
              onClick={handleResume}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶ Resume
            </button>
          )}
          <button
            onClick={handleStop}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏹ Stop Exercise
          </button>
        </div>
      </div>

      {/* Team Status Table */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Team Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-text-secondary border-b border-gray-700">
                <th className="pb-3">Team</th>
                <th className="pb-3">Dashboard</th>
                <th className="pb-3">Connection</th>
                <th className="pb-3">Injects Delivered</th>
                <th className="pb-3">Progress</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {status.teams.map(team => {
                const progressPercentage = team.total > 0
                  ? Math.round((team.delivered / team.total) * 100)
                  : 0;

                return (
                  <tr key={team.id} className="border-t border-gray-700">
                    <td className="py-3">
                      <span className="font-medium capitalize">{team.id} Team</span>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-text-secondary">Port {team.port}</span>
                    </td>
                    <td className="py-3">
                      <span className={`flex items-center gap-1 ${
                        team.status === 'connected' ? 'text-green-500' :
                        team.status === 'disconnected' ? 'text-red-500' :
                        'text-yellow-500'
                      }`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          team.status === 'connected' ? 'bg-green-500 animate-pulse' :
                          team.status === 'disconnected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}></span>
                        {team.status === 'connected' ? 'Connected' :
                         team.status === 'disconnected' ? 'Disconnected' :
                         team.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-mono">{team.delivered} / {team.total}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-secondary">{progressPercentage}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <a
                        href={team.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Dashboard →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {status.teams.length}
            </div>
            <div className="text-sm text-text-secondary">Active Teams</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-500">
              {status.teams.reduce((sum, team) => sum + team.delivered, 0)}
            </div>
            <div className="text-sm text-text-secondary">Total Injects Delivered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">
              {status.teams.reduce((sum, team) => sum + team.total, 0)}
            </div>
            <div className="text-sm text-text-secondary">Total Injects Planned</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseControlPage;