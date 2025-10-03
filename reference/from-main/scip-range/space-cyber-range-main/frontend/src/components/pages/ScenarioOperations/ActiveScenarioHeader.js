import React, { useState, useEffect } from 'react';
import { Globe, Clock, Activity, Play, Pause, Square, AlertCircle } from 'lucide-react';
import mqtt from 'mqtt';

const ActiveScenarioHeader = () => {
  const [activeScenario, setActiveScenario] = useState(null);
  const [timeRunning, setTimeRunning] = useState('00:00:00');
  const [status, setStatus] = useState('Initializing');
  const [error, setError] = useState(null);

  // Fetch initial active scenario data
  useEffect(() => {
    const fetchActiveScenario = async () => {
      try {
        const response = await fetch('/api/scenarios/active');
        if (!response.ok) {
          throw new Error('Failed to fetch active scenario');
        }
        const data = await response.json();
        if (data.active !== false) {
          setActiveScenario(data);
          setStatus(data.status?.status || 'Running');
          // Calculate initial time running
          if (data.status?.start_time) {
            const startTime = new Date(data.status.start_time * 1000);
            updateTimeRunning(startTime);
          }
        }
      } catch (error) {
        console.error('Error fetching active scenario:', error);
        setError('Failed to load scenario');
      }
    };

    fetchActiveScenario();
    const interval = setInterval(fetchActiveScenario, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Update time running
  useEffect(() => {
    if (!activeScenario?.status?.start_time) return;

    const startTime = new Date(activeScenario.status.start_time * 1000);
    const timer = setInterval(() => {
      updateTimeRunning(startTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeScenario?.status?.start_time]);

  // MQTT subscription for real-time updates
  useEffect(() => {
    const clientId = `activeScenarioHeader_${Math.random().toString(16).slice(2)}`;
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT (ActiveScenarioHeader)');
      client.subscribe('range/scenarios/active');
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.status === 'inactive' || !data.scenario_id) {
          setActiveScenario(null);
          setStatus('Inactive');
        } else {
          setStatus(data.status);
        }
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const updateTimeRunning = (startTime) => {
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000);
    const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');
    setTimeRunning(`${hours}:${minutes}:${seconds}`);
  };

  const handleStart = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/scenarios/${activeScenario.scenario_id}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to start scenario');
      }
    } catch (error) {
      console.error('Error starting scenario:', error);
      setError(error.message);
    }
  };

  const handlePause = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/scenarios/${activeScenario.scenario_id}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to pause scenario');
      }
    } catch (error) {
      console.error('Error pausing scenario:', error);
      setError(error.message);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm('Are you sure you want to end this scenario? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/scenarios/active/deactivate', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to end scenario');
      }
      
      setActiveScenario(null);
    } catch (error) {
      console.error('Error ending scenario:', error);
      setError(error.message);
    }
  };

  if (!activeScenario) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <span>No active scenario</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">
            {activeScenario.base_data?.scenario_definition?.name || 'Unnamed Scenario'}
          </h2>
          <p className="text-gray-400 mt-1">
            {activeScenario.base_data?.scenario_definition?.metadata?.description || 'No description available'}
          </p>
        </div>
        <div className="flex items-center space-x-6">
          {/* Timer */}
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-100 font-mono">{timeRunning}</span>
          </div>
          {/* Status */}
          <div className="flex items-center">
            <Activity className={`w-4 h-4 mr-2 ${
              status === 'Running' ? 'text-green-400' :
              status === 'Paused' ? 'text-yellow-400' :
              'text-gray-400'
            }`} />
            <span className={
              status === 'Running' ? 'text-green-400' :
              status === 'Paused' ? 'text-yellow-400' :
              'text-gray-400'
            }>{status}</span>
          </div>
          {/* Control Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStart}
              className={`p-2 rounded-lg ${
                status === 'Running' 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600'
              } text-white transition-colors`}
              title="Start Scenario"
              disabled={status === 'Running'}
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={handlePause}
              className={`p-2 rounded-lg ${
                status === 'Paused'
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              } text-white transition-colors`}
              title="Pause Scenario"
              disabled={status === 'Paused'}
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={handleEnd}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="End Scenario"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-6 text-sm">
        <div className="flex items-center">
          <Globe className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-gray-400">Scenario ID:</span>
          <span className="text-gray-100 ml-2">{activeScenario.scenario_id}</span>
        </div>
        <div>
          <span className="text-gray-400">Started:</span>
          <span className="text-gray-100 ml-2">
            {new Date(activeScenario.status?.start_time * 1000).toLocaleString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-center space-x-2 text-red-400 text-sm mt-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ActiveScenarioHeader;