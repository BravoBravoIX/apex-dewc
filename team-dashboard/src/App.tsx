
import { useState, useEffect, useMemo } from 'react';
import { useMqtt } from './hooks/useMqtt';
import { ThemeToggle } from './components/ThemeToggle';
import { API_HOST } from './config';

interface Inject {
  id: string;
  time: number;
  type?: string;
  content?: string | {
    headline?: string;
    body?: string;
    source?: string;
  };
  message?: string;
  data?: any;
  delivered_at?: number;
  team_id?: string;
  exercise_id?: string;
  media?: string[];  // Array of image paths
  action?: {         // Action trigger
    type: string;
    data?: any;
  };
}

// Action handler component
const InjectAction: React.FC<{ action: { type: string; data?: any }, injectId: string }> = ({ action, injectId }) => {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    console.log(`Action triggered for inject ${injectId}:`, action);

    switch (action.type) {
      case 'alert':
        // Show alert banner for 10 seconds
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 10000);
        break;

      case 'system':
        // Log system message
        console.log('System action:', action.data);
        break;

      case 'update':
        // Could update dashboard state
        console.log('Update action:', action.data);
        break;

      default:
        console.log('Unhandled action type:', action.type, action.data);
    }
  }, [action, injectId]);

  // Render alert banner if needed
  if (action.type === 'alert' && showAlert) {
    return (
      <div className="mt-3 p-3 bg-red-900/30 border border-red-500 rounded">
        <div className="flex items-center gap-2">
          <span className="text-red-400 font-semibold">⚠ Alert:</span>
          <span className="text-red-300">
            {action.data?.message || 'System alert triggered'}
          </span>
        </div>
        {action.data?.severity && (
          <span className="text-xs text-red-400">Severity: {action.data.severity}</span>
        )}
      </div>
    );
  }

  return null; // Most actions don't render anything
};

function App() {
  // Get configuration from URL parameters or use defaults
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team') || import.meta.env.VITE_TEAM_ID || 'default-team';
  const exerciseName = urlParams.get('exercise') || 'test';
  const topic = urlParams.get('topic') || import.meta.env.VITE_MQTT_TOPIC || `/exercise/${exerciseName}/team/${teamId}/feed`;

  // Detect if this is a public feed team
  const isPublicFeed = teamId.includes('-public') || teamId === 'public-feed';

  // Debug logging
  console.log('=== TEAM DASHBOARD DEBUG ===');
  console.log('Team ID:', teamId);
  console.log('Is Public Feed:', isPublicFeed);
  console.log('==========================');

  // Use dynamic URL construction for MQTT broker
  // In browser, connect to the same host that served this page
  // Use 127.0.0.1 instead of localhost for Safari compatibility
  const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const brokerUrl = import.meta.env.VITE_BROKER_URL || `ws://${hostname}:9001`;

  // Calculate timer, control, and status topics
  const timerTopic = `/exercise/${exerciseName}/timer`;
  const controlTopic = `/exercise/${exerciseName}/control`;
  const statusTopic = `/exercise/${exerciseName}/status`;
  const publicFeedTopic = `/exercise/${exerciseName}/team/public-feed/feed`;

  // Memoize topics array to prevent recreation on every render
  const mqttTopics = useMemo(() => [topic, timerTopic, controlTopic, statusTopic, publicFeedTopic], [topic, timerTopic, controlTopic, statusTopic, publicFeedTopic]);

  // Subscribe to multiple topics
  const { messages, connectionStatus } = useMqtt(brokerUrl, mqttTopics);

  const [timer, setTimer] = useState<string>('T+00:00');
  const [injects, setInjects] = useState<Inject[]>([]);
  const [exerciseState, setExerciseState] = useState<'RUNNING' | 'PAUSED' | 'STOPPED'>('RUNNING');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [turnInfo, setTurnInfo] = useState<{
    turn_based: boolean;
    current_turn?: number;
    total_turns?: number;
  }>({ turn_based: false });

  useEffect(() => {
    messages.forEach(msg => {
      try {
        const parsed = JSON.parse(msg);

        // Check if it's a timer message
        if (parsed.formatted && parsed.elapsed !== undefined) {
          setTimer(parsed.formatted);
          setLastUpdate(new Date());
        }
        // Check if it's a status message with turn info
        else if (parsed.turn_based !== undefined) {
          setTurnInfo({
            turn_based: parsed.turn_based,
            current_turn: parsed.current_turn,
            total_turns: parsed.total_turns
          });
        }
        // Check if it's a control message
        else if (parsed.command) {
          switch (parsed.command) {
            case 'pause':
              setExerciseState('PAUSED');
              break;
            case 'resume':
              setExerciseState('RUNNING');
              break;
            case 'stop':
              setExerciseState('STOPPED');
              break;
          }
        }
        // Otherwise it's an inject message
        else if (parsed.id) {
          setInjects(prev => {
            // Check if inject already exists (prevent duplicates)
            const exists = prev.some(inject => inject.id === parsed.id);
            if (exists) return prev;
            // Add new inject at the beginning
            return [parsed, ...prev];
          });
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });
  }, [messages]);

  // Get icon for inject type
  const getInjectIcon = (type?: string) => {
    switch (type) {
      case 'news': return '📰';
      case 'email': return '📧';
      case 'social': return '📱';
      case 'intel': return '🔍';
      case 'intelligence': return '🔍';
      case 'alert': return '🚨';
      case 'update': return '📊';
      default: return '📄';
    }
  };

  // Get state color
  const getStateColor = () => {
    switch (exerciseState) {
      case 'RUNNING': return 'text-green-500';
      case 'PAUSED': return 'text-yellow-500';
      case 'STOPPED': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Public Feed Layout - Clean and simple
  if (isPublicFeed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        {/* Simple header bar with logos and timer */}
        <div className="bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">APEX</h1>
              <img src="/cyberops-logo.png" alt="CyberOps" className="h-10" />
              <img src="/dewc-logo.jpeg" alt="DEWC" className="h-8" />
            </div>
            <div className="flex items-center gap-4">
              {turnInfo.turn_based && turnInfo.current_turn && turnInfo.current_turn > 0 && (
                <div className="text-lg font-semibold text-gray-700">
                  Turn {turnInfo.current_turn}{turnInfo.total_turns ? ` of ${turnInfo.total_turns}` : ''}
                </div>
              )}
              <div className="text-3xl font-mono font-bold text-blue-600">{timer}</div>
            </div>
          </div>
        </div>

        {/* Inject cards - white boxes on gradient */}
        <div className="max-w-4xl mx-auto p-6">
          {injects.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">Waiting for news updates...</p>
              <div className={`inline-block w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
            </div>
          ) : (
            <div className="space-y-4">
              {injects.map((inject, idx) => (
                <div key={idx} className="bg-white/90 backdrop-blur-sm rounded-lg shadow-2xl p-6 border border-gray-200 hover:shadow-blue-500/20 hover:shadow-2xl transition-shadow">
                  {/* Inject content */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getInjectIcon(inject.type)}</span>
                      <span className="text-sm font-bold text-blue-600 uppercase">
                        {inject.type || 'UPDATE'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 font-mono">
                      {inject.delivered_at !== undefined
                        ? `T+${Math.floor(inject.delivered_at/60).toString().padStart(2, '0')}:${(inject.delivered_at%60).toString().padStart(2, '0')}`
                        : `T+${Math.floor(inject.time/60).toString().padStart(2, '0')}:${(inject.time%60).toString().padStart(2, '0')}`
                      }
                    </span>
                  </div>

                  <div className="text-gray-900">
                    {inject.message ? (
                      <p className="text-base">{inject.message}</p>
                    ) : inject.content ? (
                      typeof inject.content === 'object' ? (
                        <div>
                          {inject.content.headline && (
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{inject.content.headline}</h3>
                          )}
                          {inject.content.body && (
                            <p className="text-gray-700 mb-2 leading-relaxed">{inject.content.body}</p>
                          )}
                          {inject.content.source && (
                            <p className="text-sm text-gray-500 italic">Source: {inject.content.source}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-base">{inject.content}</p>
                      )
                    ) : null}
                  </div>

                  {/* Media Display */}
                  {inject.media && inject.media.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {inject.media.map((mediaPath, idx) => {
                        const isImage = /\.(jpg|jpeg|png|gif)$/i.test(mediaPath);
                        if (isImage) {
                          return (
                            <img
                              key={idx}
                              src={`${API_HOST}${mediaPath}`}
                              alt="News media"
                              className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                              onClick={() => window.open(`${API_HOST}${mediaPath}`, '_blank')}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                              }}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular Team Dashboard Layout
  return (
    <div className="bg-background text-text-primary min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Timer */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            Team Dashboard: <span className="text-primary capitalize">{teamId}</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              {turnInfo.turn_based && turnInfo.current_turn && turnInfo.current_turn > 0 && (
                <div className="text-lg font-semibold text-text-primary mb-1">
                  Turn {turnInfo.current_turn}{turnInfo.total_turns ? ` of ${turnInfo.total_turns}` : ''}
                </div>
              )}
              <div className="text-3xl font-mono font-bold text-primary">{timer}</div>
              <div className={`text-sm font-semibold ${getStateColor()}`}>
                {exerciseState}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Status Bar */}
        {exerciseState !== 'RUNNING' && (
          <div className={`p-3 rounded-lg mb-4 ${
            exerciseState === 'PAUSED' ? 'bg-yellow-900/30 border border-yellow-600' :
            'bg-red-900/30 border border-red-600'
          }`}>
            <p className={`text-center font-semibold ${
              exerciseState === 'PAUSED' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {exerciseState === 'PAUSED' ? '⏸ Exercise Paused' : '⏹ Exercise Stopped'}
            </p>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-surface p-4 rounded-lg card mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></span>
              <span className={`text-sm ${
                connectionStatus === 'connected' ? 'text-green-500' :
                connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                 'Disconnected'}
              </span>
            </div>
            <div className="text-xs text-text-secondary">
              {lastUpdate && connectionStatus === 'connected' && `Last update: ${lastUpdate.toLocaleTimeString()}`}
            </div>
          </div>
        </div>

        {/* Injects Section */}
        <div className="bg-surface p-6 rounded-lg card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Received Injects ({injects.length})
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {injects.map((inject, idx) => (
              <div key={idx} className="bg-background p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getInjectIcon(inject.type)}</span>
                    <div>
                      <span className="text-sm font-semibold text-primary">
                        {inject.type?.toUpperCase() || 'INJECT'}
                      </span>
                      <span className="text-xs text-text-secondary ml-2">
                        ID: {inject.id}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary font-mono">
                    {inject.delivered_at !== undefined
                      ? `T+${Math.floor(inject.delivered_at/60).toString().padStart(2, '0')}:${(inject.delivered_at%60).toString().padStart(2, '0')}`
                      : `Scheduled: T+${Math.floor(inject.time/60).toString().padStart(2, '0')}:${(inject.time%60).toString().padStart(2, '0')}`
                    }
                  </span>
                </div>

                <div className="text-text-primary mt-2">
                  {inject.message ? (
                    inject.message
                  ) : inject.content ? (
                    typeof inject.content === 'object' ? (
                      <div>
                        {inject.content.headline && (
                          <div className="font-semibold mb-1">{inject.content.headline}</div>
                        )}
                        {inject.content.body && (
                          <div className="mb-1">{inject.content.body}</div>
                        )}
                        {inject.content.source && (
                          <div className="text-sm text-text-secondary italic">Source: {inject.content.source}</div>
                        )}
                      </div>
                    ) : (
                      inject.content
                    )
                  ) : (
                    <div className="text-sm font-mono bg-gray-800 p-2 rounded">
                      {JSON.stringify(inject.data || inject, null, 2)}
                    </div>
                  )}
                </div>

                {/* Media Display */}
                {inject.media && inject.media.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {inject.media.map((mediaPath, idx) => {
                      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(mediaPath);

                      if (isImage) {
                        return (
                          <img
                            key={idx}
                            src={`${API_HOST}${mediaPath}`}
                            alt="Inject media"
                            className="rounded cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxWidth: '400px', maxHeight: '300px', objectFit: 'contain' }}
                            onClick={() => window.open(`${API_HOST}${mediaPath}`, '_blank')}
                            onError={(e) => {
                              // Show placeholder on error
                              const target = e.currentTarget;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzJhMmEyYSIgc3Ryb2tlPSIjNDQ0IiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiPkltYWdlIFVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
                              target.style.cursor = 'default';
                              target.onclick = null;
                            }}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Action Handler */}
                {inject.action && <InjectAction action={inject.action} injectId={inject.id} />}
              </div>
            ))}

            {injects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-text-secondary mb-2">Waiting for injects...</p>
                <p className="text-xs text-text-secondary">
                  Listening on: <code className="bg-background px-2 py-1 rounded">{topic}</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

