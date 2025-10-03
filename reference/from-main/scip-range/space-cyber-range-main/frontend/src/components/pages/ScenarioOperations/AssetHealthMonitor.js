import React, { useState, useEffect } from 'react';
import { Server, Satellite, Radio, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import mqtt from 'mqtt';

const AssetHealthMonitor = ({ teamId }) => {
  const [assets, setAssets] = useState({});
  const [activeScenario, setActiveScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Asset type config
  const assetConfig = {
    ground_station: { icon: Server, label: "Ground Station" },
    satellite: { icon: Satellite, label: "Satellite" },
    rf_simulator: { icon: Radio, label: "RF Simulator" }
  };

  // Fetch initial active scenario
  useEffect(() => {
    const fetchActiveScenario = async () => {
      try {
        const response = await fetch('/api/scenarios/active');
        const data = await response.json();
        if (data.active !== false) {
          setActiveScenario(data);
          // Initial assets fetch if team is selected
          if (teamId) {
            const instanceResponse = await fetch(
              `/api/scenarios/${data.scenario_id}/instances/${teamId}`
            );
            if (instanceResponse.ok) {
              const instanceData = await instanceResponse.json();
              setAssets(instanceData.assets || {});
            }
          }
        }
      } catch (error) {
        console.error('Error fetching scenario data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveScenario();
  }, [teamId]);

  // MQTT subscription
  useEffect(() => {
    if (!activeScenario?.scenario_id || !teamId) return;

    console.log('Setting up MQTT for asset health...');
    const clientId = `assetHealth_${Math.random().toString(16).slice(2)}`;
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT (AssetHealth)');
      const topic = `range/scenarios/${activeScenario.scenario_id}/instances/${teamId}/assets/+`;
      console.log('Subscribing to:', topic);
      client.subscribe(topic);
    });

    client.on('message', (topic, message) => {
      try {
        const assetType = topic.split('/').pop();
        const data = JSON.parse(message.toString());
        console.log(`Received ${assetType} update:`, data);

        setAssets(prev => ({
          ...prev,
          [assetType]: data
        }));
      } catch (error) {
        console.error('Error processing asset update:', error);
      }
    });

    return () => {
      console.log('Cleaning up MQTT connection...');
      client.end();
    };
  }, [activeScenario?.scenario_id, teamId]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-gray-400 text-center">Loading asset health...</div>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100">Asset Health</h3>
        </div>
        <div className="text-gray-400 text-center py-8">
          Select a team to view their assets
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Asset Health</h3>
        <span className="text-sm text-gray-400">Team {teamId} Assets</span>
      </div>
      
      <div className="space-y-4">
        {Object.entries(assets).map(([assetType, asset]) => {
          const { icon: Icon, label } = assetConfig[assetType] || {};
          if (!Icon) return null;

          return (
            <div key={assetType} className="bg-gray-750 rounded-lg p-4 space-y-3">
              {/* Asset Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Icon className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-100">{label}</span>
                </div>
                {getStatusIcon(asset.status)}
              </div>

              {/* Resource Usage */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-400">CPU</div>
                  <div className="text-gray-100">{Math.round(asset.stats?.cpu || 0)}%</div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1">
                    <div
                      className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${asset.stats?.cpu || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Memory</div>
                  <div className="text-gray-100">{Math.round(asset.stats?.memory || 0)}%</div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1">
                    <div
                      className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${asset.stats?.memory || 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Storage</div>
                  <div className="text-gray-100">{Math.round(asset.stats?.storage || 0)}%</div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1">
                    <div
                      className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${asset.stats?.storage || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Asset-specific Details */}
              <div className="border-t border-gray-700 pt-3 space-y-1">
                {Object.entries(asset.details || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-gray-100">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetHealthMonitor;