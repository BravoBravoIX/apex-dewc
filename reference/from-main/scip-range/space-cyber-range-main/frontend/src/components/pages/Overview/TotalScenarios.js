import React, { useState, useEffect } from 'react';
import { Files } from 'lucide-react';
import mqtt from 'mqtt';

const TotalScenarios = () => {
  const [scenarioStats, setScenarioStats] = useState({
    total: 0,
    scenarios: []
  });
  const [activeScenario, setActiveScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch scenarios list
        const scenariosResponse = await fetch('/api/scenarios');
        if (!scenariosResponse.ok) {
          throw new Error(`Failed to fetch scenarios: ${scenariosResponse.statusText}`);
        }
        const scenariosData = await scenariosResponse.json();
        
        // Update scenarios count whether or not we have an active scenario
        setScenarioStats({
          total: scenariosData.scenarios?.length || 0,
          scenarios: scenariosData.scenarios || []
        });
        
        // Fetch active scenario
        const activeResponse = await fetch('/api/scenarios/active');
        if (!activeResponse.ok) {
          console.warn('No active scenario found');
          setActiveScenario(null);
          return;
        }
        
        const activeData = await activeResponse.json();
        if (activeData && activeData.active !== false) {
          setActiveScenario(activeData);
        } else {
          setActiveScenario(null);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // MQTT Subscription
  useEffect(() => {
    const clientId = `totalScenarios_${Math.random().toString(16).slice(2)}`;
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT (TotalScenarios)');
      client.subscribe('range/scenarios/active');
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (topic === 'range/scenarios/active') {
          if (data.status === 'inactive' || !data.scenario_id) {
            setActiveScenario(null);
          } else {
            setActiveScenario(data);
          }
        }
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Scenarios</h2>
        <Files className="w-5 h-5 text-blue-400" />
      </div>

      <div className="space-y-4">
        {/* Available Scenarios */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Available Scenarios</span>
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : error ? (
            <span className="text-red-400 text-sm">{error}</span>
          ) : (
            <span className="text-2xl font-bold text-gray-100">{scenarioStats.total}</span>
          )}
        </div>

        {/* Active Scenario */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Active Scenario</span>
          {loading ? (
            <span className="text-gray-400">Loading...</span>
          ) : activeScenario ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-100">
                {activeScenario.name || activeScenario.scenario_id}
              </span>
              <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-400">
                Active
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">None Active</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TotalScenarios;