import React, { useState, useEffect } from 'react'
import { PlayCircle, Plus, Refresh, Monitor, ExternalLink, Send, Wifi, WifiOff, AlertTriangle, MessageSquare } from 'lucide-react'
import { mqttClient } from '../services/mqttClient'

interface DeployedTeam {
  id: string;
  name: string;
  exerciseId: string;
  status: string;
  port?: number;
  mqtt_status?: string;
  mqtt_last_check?: string;
}

const ExercisesPage: React.FC = () => {
  const [deployedTeams, setDeployedTeams] = useState<DeployedTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTests, setSendingTests] = useState<Set<string>>(new Set());
  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttConnecting, setMqttConnecting] = useState(false);

  const fetchDeployedTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8001/api/v1/dashboards/list');
      if (response.ok) {
        const data = await response.json();
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

  // Initialize MQTT connection
  useEffect(() => {
    const initMqtt = async () => {
      setMqttConnecting(true);
      try {
        await mqttClient.connect();
        setMqttConnected(true);
      } catch (error) {
        console.error('Failed to connect to MQTT:', error);
        setMqttConnected(false);
      } finally {
        setMqttConnecting(false);
      }
    };

    mqttClient.onConnectionChange((connected) => {
      setMqttConnected(connected);
      if (!connected) {
        setMqttConnecting(false);
      }
    });

    initMqtt();
    fetchDeployedTeams();
    const interval = setInterval(fetchDeployedTeams, 30000);

    return () => {
      clearInterval(interval);
      mqttClient.disconnect();
    };
  }, []);

  const getMqttStatusStyle = (mqttStatus?: string) => {
    switch (mqttStatus) {
      case 'connected':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
      case 'container_error':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'container_down':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const formatMqttStatus = (mqttStatus?: string) => {
    switch (mqttStatus) {
      case 'connected':
        return '🟢 Connected';
      case 'connecting':
        return '🟡 Connecting';
      case 'error':
        return '🔴 Error';
      case 'container_error':
        return '🔴 Container Error';
      case 'container_down':
        return '⚪ Container Down';
      default:
        return '⚫ Unknown';
    }
  };

  const sendTestMessage = async (teamId: string, messageType: 'news' | 'alert' | 'decision' = 'news') => {
    const key = `${teamId}-${messageType}`;
    setSendingTests(prev => new Set(prev).add(key));

    try {
      await mqttClient.sendTestMessageToTeam(teamId, messageType);
      console.log(`${messageType} test message sent to ${teamId}`);
      // Could show a success notification here
    } catch (error) {
      console.error(`Error sending ${messageType} test message to ${teamId}:`, error);
      // Could show an error notification here
    } finally {
      setSendingTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exercises</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure and launch cybersecurity exercises
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* MQTT Connection Status */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            {mqttConnecting ? (
              <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
            ) : mqttConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              MQTT: {mqttConnecting ? 'Connecting...' : mqttConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            onClick={fetchDeployedTeams}
            disabled={loading}
            className="btn btn-outline flex items-center gap-2"
          >
            <Refresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn-primary inline-flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Exercise</span>
          </button>
        </div>
      </div>

      {/* Active Team Dashboards */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Team Dashboards</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Monitor deployed team dashboards and their connection status
          </p>
        </div>
        <div className="card-content">
          {deployedTeams.length === 0 ? (
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Monitor className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 dark:text-slate-400">No team dashboards deployed</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {deployedTeams.map(team => (
                <div key={team.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-slate-900 dark:text-white">{team.name}</div>
                      {team.port && (
                        <a
                          href={`http://localhost:${team.port}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Port: {team.port || 'N/A'} • Exercise: {team.exerciseId}
                    </div>
                    {team.mqtt_last_check && (
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        Last checked: {new Date(team.mqtt_last_check).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        team.status === 'running'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        Docker: {team.status}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMqttStatusStyle(team.mqtt_status)}`}>
                      MQTT: {formatMqttStatus(team.mqtt_status)}
                    </span>

                    {/* Manual Test Buttons - Only show if MQTT connected */}
                    {mqttConnected && team.status === 'running' && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={() => sendTestMessage(team.id, 'news')}
                          disabled={sendingTests.has(`${team.id}-news`)}
                          className="btn btn-outline btn-sm flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20"
                          title="Send test news message"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {sendingTests.has(`${team.id}-news`) ? '...' : 'News'}
                        </button>
                        <button
                          onClick={() => sendTestMessage(team.id, 'alert')}
                          disabled={sendingTests.has(`${team.id}-alert`)}
                          className="btn btn-outline btn-sm flex items-center gap-1 text-xs bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20"
                          title="Send test alert message"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {sendingTests.has(`${team.id}-alert`) ? '...' : 'Alert'}
                        </button>
                        <button
                          onClick={() => sendTestMessage(team.id, 'decision')}
                          disabled={sendingTests.has(`${team.id}-decision`)}
                          className="btn btn-outline btn-sm flex items-center gap-1 text-xs bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20"
                          title="Send test decision request"
                        >
                          <Send className="w-3 h-3" />
                          {sendingTests.has(`${team.id}-decision`) ? '...' : 'Decision'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Future Exercise Configuration */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Exercise Configuration</h3>
        </div>
        <div className="card-content">
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PlayCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 dark:text-slate-400">Exercise configuration interface will be implemented here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExercisesPage