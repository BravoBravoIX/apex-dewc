import React, { useState, useEffect } from 'react';
import { Box, Play, Pause, Server } from 'lucide-react';
import mqtt from 'mqtt';

// Helper Functions
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'running':
      return 'bg-green-400';
    case 'paused':
      return 'bg-yellow-400';
    case 'initializing':
      return 'bg-blue-400';
    case 'error':
      return 'bg-red-400';
    default:
      return 'bg-gray-400';
  }
};

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'running':
      return <Play className="w-4 h-4 text-green-400" />;
    case 'paused':
      return <Pause className="w-4 h-4 text-yellow-400" />;
    case 'error':
      return <Server className="w-4 h-4 text-red-400" />;
    default:
      return <Box className="w-4 h-4 text-gray-400" />;
  }
};

const formatDuration = (startTime) => {
  if (!startTime) return '0h 0m';
  const seconds = Math.floor(Date.now() / 1000 - startTime);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

// ActiveInstances Component
const ActiveInstances = () => {
  const [instances, setInstances] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchActiveScenario = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/scenarios/active');
        const data = await response.json();

        console.log('Active Scenario Response:', data);

        if (data.active !== false) {
          setActiveScenario({
            scenario_id: data.scenario_id,
            name: data.base_data?.scenario_definition?.name || 'Unnamed Scenario',
          });

          // Fetch initial instances
          const instancesResponse = await fetch(`/api/scenarios/${data.scenario_id}/instances`);
          if (instancesResponse.ok) {
            const instancesData = await instancesResponse.json();
            console.log('Initial Instances Data:', instancesData);
            setInstances(instancesData.instances || []);
          }
        } else {
          setActiveScenario(null);
          setInstances([]);
        }
      } catch (error) {
        console.error('Error fetching scenario data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveScenario();
    // Poll for updates every 30 seconds as backup
    const interval = setInterval(fetchActiveScenario, 30000);
    return () => clearInterval(interval);
  }, []);

  // MQTT Subscription
  useEffect(() => {
    if (!activeScenario?.scenario_id) return;

    console.log('Setting up MQTT connection for instances...');
    const clientId = `activeInstances_${Math.random().toString(16).slice(2)}`;
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId,
      reconnectPeriod: 1000,
      keepalive: 60,
      connectTimeout: 30 * 1000,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT (ActiveInstances)');
      setConnectionStatus('connected');
      
      // Subscribe to instance status updates
      const topic = `range/scenarios/${activeScenario.scenario_id}/instances/+/status`;
      console.log('Subscribing to:', topic);
      client.subscribe(topic);
    });

    client.on('message', (topic, message) => {
      try {
        console.log('Received MQTT message:', topic, message.toString());
        const data = JSON.parse(message.toString());
        
        // Update instances state
        setInstances(prev => {
          const existingIndex = prev.findIndex(i => i.team_id === data.team_id);
          if (existingIndex >= 0) {
            // Update existing instance
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...data };
            return updated;
          }
          // Add new instance
          return [...prev, data];
        });
      } catch (error) {
        console.error('Error processing instance message:', error);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err);
      setConnectionStatus('error');
    });

    return () => {
      console.log('Cleaning up MQTT connection...');
      client.end();
    };
  }, [activeScenario?.scenario_id]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-gray-400 text-center py-4">Loading instances...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="text-red-400 text-center py-4">Error loading instances: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">
          {activeScenario?.name || 'No Active Scenario'}
        </h2>
        <Box className="w-5 h-5 text-blue-400" />
      </div>

      {connectionStatus === 'error' && (
        <div className="text-red-400 text-sm mb-4">
          Unable to connect to instances monitoring
        </div>
      )}

      {(!activeScenario || instances.length === 0) ? (
        <div className="text-gray-400 text-center py-4">No active instances</div>
      ) : (
        <div className="space-y-4">
          {instances.map((instance) => (
            <div
              key={instance.team_id || instance.instance_id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.status)}`} />
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(instance.status)}
                    <span className="text-gray-100 font-medium">
                      {instance.team_name || `Instance ${instance.team_id}`}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {formatDuration(instance.start_time)}
                </div>
              </div>

              {/* Progress Information */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{instance.current_stage}</span>
                  <span>{Math.round(instance.progress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-400 rounded-full h-2 transition-all duration-300"
                    style={{ width: `${instance.progress || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveInstances;