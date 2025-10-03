import React, { useState, useEffect } from 'react'
import { Monitor, Refresh } from 'lucide-react'
import MessageTestPanel from '../components/testing/MessageTestPanel'

interface DeployedTeam {
  id: string;
  name: string;
  exerciseId: string;
  status: string;
  port?: number;
  mqtt_status?: string;
  mqtt_last_check?: string;
}

const MonitorPage: React.FC = () => {
  const [deployedTeams, setDeployedTeams] = useState<DeployedTeam[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeployedTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/v1/dashboards/list');
      if (response.ok) {
        const data = await response.json();
        // Transform the API response to match our interface
        const teams = Array.isArray(data) ? data.map((dashboard: any) => ({
          id: dashboard.team_id,
          name: dashboard.team_name || dashboard.team_id,
          exerciseId: dashboard.exercise_id,
          status: dashboard.status || 'running',
          port: dashboard.port,
          mqtt_status: dashboard.mqtt_status,
          mqtt_last_check: dashboard.mqtt_last_check
        })) : [];
        setDeployedTeams(teams);
      }
    } catch (error) {
      console.error('Failed to fetch deployed teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployedTeams();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDeployedTeams, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exercise Monitor</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time monitoring and message testing for active exercises
          </p>
        </div>
        <button
          onClick={fetchDeployedTeams}
          disabled={loading}
          className="btn btn-outline flex items-center gap-2"
        >
          <Refresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Status Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Deployed Teams</h3>
          </div>
          <div className="card-content">
            {deployedTeams.length === 0 ? (
              <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Monitor className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-400">No teams deployed</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {deployedTeams.map(team => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{team.name}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Port: {team.port || 'N/A'} • Exercise: {team.exerciseId}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      team.status === 'running' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {team.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MQTT Service Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Service Status</h3>
          </div>
          <div className="card-content space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">MQTT Broker</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">localhost:1883</div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Running
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">MQTT Trigger Service</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">localhost:8002</div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Running
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div>
                <div className="font-medium text-slate-900 dark:text-white">WebSocket Gateway</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">localhost:8765</div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Running
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Testing Panel */}
      <MessageTestPanel deployedTeams={deployedTeams} />
    </div>
  )
}

export default MonitorPage