import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, AlertTriangle, HelpCircle } from 'lucide-react';

interface DeployedTeam {
  id: string;
  name: string;
  exerciseId: string;
  status: string;
  port?: number;
  mqtt_status?: string;
  mqtt_last_check?: string;
}

interface MessageTestPanelProps {
  deployedTeams: DeployedTeam[];
}

const MessageTestPanel: React.FC<MessageTestPanelProps> = ({ deployedTeams }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: any }>({});

  const sendTestMessage = async (teamId: string, exerciseId: string, messageType: string) => {
    const loadingKey = `${teamId}-${messageType}`;
    setLoading(loadingKey);

    try {
      const messagePayload = {
        message_type: messageType,
        priority: messageType === 'alert' ? 'urgent' : messageType === 'decision' ? 'flash' : 'routine',
        classification: 'UNCLASSIFIED',
        source: 'Exercise Control',
        target_teams: [teamId],
        exercise_id: exerciseId,
        title: '',
        content: ''
      };

      switch (messageType) {
        case 'news':
          messagePayload.title = '🚨 BREAKING NEWS';
          messagePayload.content = 'This is a test news message injected from the admin dashboard. Stay tuned for updates.';
          break;
        case 'alert':
          messagePayload.title = '⚠️ SECURITY ALERT';
          messagePayload.content = 'This is a test security alert from the admin dashboard. Please review and acknowledge.';
          break;
        case 'decision':
          messagePayload.title = '🤔 CRITICAL DECISION';
          messagePayload.content = 'This is a test decision request from the admin dashboard. Your input is required.';
          break;
      }
      
      const response = await fetch('http://localhost:8001/api/v1/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      });

      const result = await response.json();
      
      if (response.ok) {
        setResults(prev => ({
          ...prev,
          [loadingKey]: { success: true, data: result }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          [loadingKey]: { success: false, error: result }
        }));
      }
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [loadingKey]: { success: false, error: error.message }
      }));
    } finally {
      setLoading(null);
    }
  };

  const getButtonIcon = (messageType: string) => {
    switch (messageType) {
      case 'news':
        return <MessageSquare className="w-4 h-4" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'decision':
        return <HelpCircle className="w-4 h-4" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getButtonColor = (messageType: string) => {
    switch (messageType) {
      case 'news':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'alert':
        return 'bg-red-600 hover:bg-red-700';
      case 'decision':
        return 'bg-amber-600 hover:bg-amber-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const formatMessageType = (type: string) => {
    switch (type) {
      case 'news':
        return 'News';
      case 'alert':
        return 'Alert';
      case 'decision':
        return 'Decision';
      default:
        return type;
    }
  };

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

  if (deployedTeams.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Message Testing</h3>
        </div>
        <div className="card-content">
          <div className="text-center py-8">
            <Send className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No teams deployed. Deploy teams first to test message injection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Message Testing</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Inject test messages to deployed team dashboards
        </p>
      </div>
      <div className="card-content space-y-6">
        {deployedTeams.map(team => (
          <div key={team.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">{team.name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Exercise: {team.exerciseId} • Port: {team.port || 'N/A'}
                </p>
                {team.mqtt_last_check && (
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    Last checked: {new Date(team.mqtt_last_check).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  team.status === 'running' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  Docker: {team.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMqttStatusStyle(team.mqtt_status)}`}>
                  MQTT: {formatMqttStatus(team.mqtt_status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['news', 'alert', 'decision'].map(messageType => {
                const loadingKey = `${team.id}-${messageType}`;
                const isLoading = loading === loadingKey;
                const result = results[loadingKey];

                return (
                  <div key={messageType} className="flex flex-col">
                    <button
                      onClick={() => sendTestMessage(team.id, team.exerciseId, messageType)}
                      disabled={isLoading || team.status !== 'running'}
                      className={`
                        flex items-center justify-center gap-2 px-3 py-2 rounded text-white text-sm font-medium
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                        ${getButtonColor(messageType)}
                      `}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        getButtonIcon(messageType)
                      )}
                      {formatMessageType(messageType)}
                    </button>
                    
                    {result && (
                      <div className={`mt-1 text-xs px-2 py-1 rounded ${
                        result.success 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {result.success ? '✓ Sent' : '✗ Failed'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show recent results for this team */}
            {Object.entries(results)
              .filter(([key]) => key.startsWith(team.id))
              .slice(-1) // Show only the most recent
              .map(([key, result]) => (
                <div key={key} className="mt-3 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Result:</span>
                    {result.success && result.data?.message_id && (
                      <code className="text-slate-600 dark:text-slate-400">
                        {result.data.message_id}
                      </code>
                    )}
                  </div>
                  {result.success && (
                    <div className="text-slate-600 dark:text-slate-400 mt-1 space-y-1">
                      <div>Published: {result.data?.success_count || 0} teams</div>
                      <div>Failed: {result.data?.failed_teams?.length || 0} teams</div>
                      {result.data?.timestamp && (
                        <div>Time: {new Date(result.data.timestamp).toLocaleTimeString()}</div>
                      )}
                    </div>
                  )}
                  {!result.success && (
                    <div className="text-red-600 dark:text-red-400 mt-1">
                      Error: {result.error?.detail || result.error}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5">
              ℹ️
            </div>
            <div className="text-sm">
              <p className="text-blue-900 dark:text-blue-100 font-medium">Testing Instructions:</p>
              <ul className="mt-2 text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Ensure team dashboards are deployed and running</li>
                <li>• Click message type buttons to inject test content</li>
                <li>• Check team dashboards to see real-time updates</li>
                <li>• WebSocket connection status shown in dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageTestPanel;