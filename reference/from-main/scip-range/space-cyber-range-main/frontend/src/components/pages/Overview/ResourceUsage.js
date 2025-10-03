import React, { useState, useEffect } from 'react';
import { BarChart2, Wifi, WifiOff } from 'lucide-react';
import mqtt from 'mqtt';

const ResourceUsage = () => {
  const [resources, setResources] = useState({
    cpu: { used: 0, total: 32, usage_percent: 0 },
    memory: { used: 0, total: 64, usage_percent: 0 },
    storage: { used: 0, total: 1000, usage_percent: 0 }
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Generate a unique client ID
    const clientId = `resourceUsage_${Math.random().toString(16).slice(2)}`;

    console.log('Connecting to MQTT for resource stats...');
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId: clientId,
      reconnectPeriod: 1000,
      keepalive: 60,
      connectTimeout: 30 * 1000,
    });

    const handleConnect = () => {
      console.log('Connected to MQTT for resource stats');
      setConnectionStatus('connected');
      client.subscribe('range/status/resources/#', (err) => {
        if (err) {
          console.error('Subscription error:', err);
          setConnectionStatus('error');
        }
      });
    };

    const handleMessage = (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const resourceType = topic.split('/').pop();
        
        // Validate and sanitize incoming data
        if (['cpu', 'memory', 'storage'].includes(resourceType)) {
          setResources(prev => ({
            ...prev,
            [resourceType]: {
              ...data,
              // Ensure numeric values
              used: Number(data.used) || 0,
              total: Number(data.total) || 0,
              usage_percent: Number(data.usage_percent) || 0
            }
          }));
        }
      } catch (error) {
        console.error('Error processing resource message:', error);
      }
    };

    const handleError = (err) => {
      console.error('MQTT Resource Stats Error:', err);
      setConnectionStatus('error');
    };

    const handleReconnect = () => {
      console.log('Attempting to reconnect to MQTT...');
      setConnectionStatus('connecting');
    };

    client.on('connect', handleConnect);
    client.on('message', handleMessage);
    client.on('error', handleError);
    client.on('reconnect', handleReconnect);

    return () => {
      client.removeListener('connect', handleConnect);
      client.removeListener('message', handleMessage);
      client.removeListener('error', handleError);
      client.removeListener('reconnect', handleReconnect);
      client.end(true);
    };
  }, []);

  const formatStorage = (gb) => {
    return gb >= 1024 
      ? `${(gb / 1024).toFixed(1)}TB` 
      : `${gb.toFixed(1)}GB`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-100">Resource Usage</h2>
          {connectionStatus === 'connected' ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : connectionStatus === 'error' ? (
            <WifiOff className="w-5 h-5 text-red-400" />
          ) : (
            <Wifi className="w-5 h-5 text-yellow-400 animate-pulse" />
          )}
        </div>
        <BarChart2 className="w-5 h-5 text-blue-400" />
      </div>

      {connectionStatus === 'error' && (
        <div className="text-red-400 text-sm mb-4">
          Unable to connect to resource monitoring
        </div>
      )}

      <div className="space-y-4">
        {/* CPU Usage */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">CPU</span>
            <span className="text-gray-400">
              {resources.cpu.used}/{resources.cpu.total} cores ({resources.cpu.usage_percent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-400 rounded-full h-2"
              style={{ width: `${resources.cpu.usage_percent}%` }}
            />
          </div>
        </div>
        
        {/* Memory Usage */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Memory</span>
            <span className="text-gray-400">
              {resources.memory.used.toFixed(1)}/{resources.memory.total} GB ({resources.memory.usage_percent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-400 rounded-full h-2"
              style={{ width: `${resources.memory.usage_percent}%` }}
            />
          </div>
        </div>
        
        {/* Storage Usage */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Storage</span>
            <span className="text-gray-400">
              {formatStorage(resources.storage.used)}/{formatStorage(resources.storage.total)} ({resources.storage.usage_percent.toFixed(1)}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-400 rounded-full h-2"
              style={{ width: `${resources.storage.usage_percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceUsage;
