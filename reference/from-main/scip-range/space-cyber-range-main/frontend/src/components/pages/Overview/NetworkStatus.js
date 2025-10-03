import React, { useState, useEffect } from 'react';
import { Network, Wifi, WifiOff } from 'lucide-react';
import mqtt from 'mqtt';

const NetworkStatus = () => {
  const [network, setNetwork] = useState({
    status: 'initializing',
    latency: 0,
    bandwidth: 0,
    active_connections: 0
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    // Generate a unique client ID
    const clientId = `networkStatus_${Math.random().toString(16).slice(2)}`;

    console.log('Connecting to MQTT for network stats...');
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId: clientId,
      reconnectPeriod: 1000,
      keepalive: 60,
      connectTimeout: 30 * 1000,
    });

    const handleConnect = () => {
      console.log('Connected to MQTT for network stats');
      setConnectionStatus('connected');
      client.subscribe('range/status/health/network/#', (err) => {
        if (err) {
          console.error('Subscription error:', err);
          setConnectionStatus('error');
        }
      });
    };

    const handleMessage = (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Check if the message is from the management topic
        if (topic.endsWith('management')) {
          setNetwork(prev => ({
            ...prev,
            status: data.status || 'operational',
            latency: Number(data.latency) || prev.latency,
            bandwidth: Number(data.bandwidth) || prev.bandwidth,
            active_connections: Number(data.active_connections) || prev.active_connections
          }));
        }
      } catch (error) {
        console.error('Error processing network message:', error);
      }
    };

    const handleError = (err) => {
      console.error('MQTT Network Stats Error:', err);
      setConnectionStatus('error');
      setNetwork(prev => ({ ...prev, status: 'error' }));
    };

    const handleReconnect = () => {
      console.log('Attempting to reconnect to MQTT...');
      setConnectionStatus('connecting');
      setNetwork(prev => ({ ...prev, status: 'reconnecting' }));
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

  // Determine status color and icon
  const getStatusColor = () => {
    switch (network.status) {
      case 'operational':
      case 'connected':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'error':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-gray-100">Network Status</h2>
          {connectionStatus === 'connected' ? (
            <Wifi className={`w-5 h-5 ${getStatusColor()}`} />
          ) : connectionStatus === 'error' ? (
            <WifiOff className="w-5 h-5 text-red-400" />
          ) : (
            <Wifi className="w-5 h-5 text-yellow-400 animate-pulse" />
          )}
        </div>
        <Network className="w-5 h-5 text-blue-400" />
      </div>

      {connectionStatus === 'error' && (
        <div className="text-red-400 text-sm mb-4">
          Unable to connect to network monitoring
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">Latency</div>
          <div className="text-xl font-bold text-gray-100">
            {network.latency.toFixed(1)}ms
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Bandwidth</div>
          <div className="text-xl font-bold text-gray-100">
            {(network.bandwidth / 1000).toFixed(1)} Gbps
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Status</div>
          <div className={`text-xl font-bold ${getStatusColor()}`}>
            {network.status}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Connections</div>
          <div className="text-xl font-bold text-gray-100">
            {network.active_connections}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;
