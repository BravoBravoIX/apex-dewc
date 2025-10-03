import React, { useState, useEffect } from 'react';
import { Shield, Activity, Server, Database } from 'lucide-react';
import mqtt from 'mqtt';

const ServicesHealth = () => {
  const [services, setServices] = useState({
    mqtt: { status: 'initializing', uptime: 0 },
    redis: { status: 'initializing', uptime: 0, clients: 0, memory_usage: '0B' },
    api: { status: 'initializing', uptime: 0, pid: null }
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-400';
      case 'degraded':
        return 'bg-yellow-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Service icons
  const getServiceIcon = (serviceName) => {
    switch (serviceName) {
      case 'mqtt':
        return <Activity className="w-4 h-4 text-blue-400" />;
      case 'redis':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'api':
        return <Server className="w-4 h-4 text-green-400" />;
      default:
        return <Shield className="w-4 h-4 text-gray-400" />;
    }
  };

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  useEffect(() => {
    // Generate a unique client ID
    const clientId = `servicesHealth_${Math.random().toString(16).slice(2)}`;

    console.log('Connecting to MQTT for services stats...');
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId: clientId,
      reconnectPeriod: 1000,
      keepalive: 60,
      connectTimeout: 30 * 1000,
    });

    const handleConnect = () => {
      console.log('Connected to MQTT for services stats');
      setConnectionStatus('connected');
      client.subscribe('range/status/services/#', (err) => {
        if (err) {
          console.error('Subscription error:', err);
          setConnectionStatus('error');
        }
      });
    };

    const handleMessage = (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        const serviceName = topic.split('/')[3];

        if (['mqtt', 'redis', 'api'].includes(serviceName)) {
          setServices(prev => ({
            ...prev,
            [serviceName]: {
              ...data,
              status: data.status || 'initializing',
              uptime: Number(data.uptime) || 0
            }
          }));
        }
      } catch (error) {
        console.error('Error processing service message:', error);
      }
    };

    const handleError = (err) => {
      console.error('MQTT Services Stats Error:', err);
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

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Services Health</h2>
        <Shield className="w-5 h-5 text-blue-400" />
      </div>
      
      {connectionStatus === 'error' && (
        <div className="text-red-400 text-sm mb-4">
          Unable to connect to services monitoring
        </div>
      )}

      <div className="space-y-3">
        {Object.entries(services).map(([serviceName, service]) => (
          <div 
            key={serviceName} 
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(service.status)}`} />
              <div className="flex items-center space-x-2">
                {getServiceIcon(serviceName)}
                <span className="text-gray-100 capitalize">{serviceName}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 capitalize">{service.status}</span>
              <span className="text-sm text-gray-400">
                {formatUptime(service.uptime)}
              </span>
              {serviceName === 'redis' && (
                <span className="text-sm text-gray-400">
                  ({service.clients} clients, {service.memory_usage})
                </span>
              )}
              {serviceName === 'api' && service.pid && (
                <span className="text-sm text-gray-400">
                  (PID: {service.pid})
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesHealth;
