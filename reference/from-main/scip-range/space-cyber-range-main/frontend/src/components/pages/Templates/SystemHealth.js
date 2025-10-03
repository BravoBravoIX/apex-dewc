import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Activity, Server, Network } from 'lucide-react';

const SystemHealth = () => {
  const [metrics, setMetrics] = useState({
    serviceStatus: 'disconnected',
    networkLatency: null,
    activeVMs: 0,
    activeConnections: 0,
    lastUpdate: null,
    isConnected: false,
    activeVMMap: new Map() // Track individual VM heartbeats
  });

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');
    let statusChecker;

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe('range/status/health');
      client.subscribe('range/vm/+/heartbeat'); // Subscribe to all VM heartbeats
    });

    client.on('message', (topic, message) => {
      const now = Date.now();
      
      if (topic === 'range/status/health') {
        try {
          const data = JSON.parse(message.toString());
          const messageTimestamp = data.timestamp;
          const latency = messageTimestamp ? now - messageTimestamp : null;

          setMetrics(prev => ({
            ...prev,
            serviceStatus: 'operational',
            networkLatency: latency > 0 && latency < 1000 ? latency : null,
            activeConnections: data.active_connections,
            lastUpdate: now,
            isConnected: true
          }));
        } catch (error) {
          console.error('Error processing health message:', error);
        }
      }
      
      // Handle VM heartbeats
      else if (topic.startsWith('range/vm/')) {
        try {
          const vmId = topic.split('/')[2];
          const data = JSON.parse(message.toString());
          
          setMetrics(prev => {
            const updatedVMMap = new Map(prev.activeVMMap);
            updatedVMMap.set(vmId, now);

            // Clean old entries (older than 10 seconds)
            for (const [id, lastSeen] of updatedVMMap.entries()) {
              if (now - lastSeen > 10000) {
                updatedVMMap.delete(id);
              }
            }

            return {
              ...prev,
              activeVMMap: updatedVMMap,
              activeVMs: updatedVMMap.size
            };
          });
        } catch (error) {
          console.error('Error processing VM heartbeat:', error);
        }
      }
    });

    // Check for stale connection
    statusChecker = setInterval(() => {
      setMetrics(prev => {
        if (!prev.lastUpdate) return prev;
        
        const timeSinceUpdate = Date.now() - prev.lastUpdate;
        if (timeSinceUpdate > 10000) {
          return {
            ...prev,
            serviceStatus: 'disconnected',
            isConnected: false,
            networkLatency: null,
            activeVMs: 0,
            activeConnections: 0,
            activeVMMap: new Map()
          };
        } else if (timeSinceUpdate > 5000) {
          return {
            ...prev,
            serviceStatus: 'unstable'
          };
        }
        return prev;
      });
    }, 1000);

    return () => {
      if (statusChecker) clearInterval(statusChecker);
      client.end();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-100">System Health</h3>
        <Activity className={`w-5 h-5 ${
          metrics.serviceStatus === 'operational' ? 'text-green-400' : 
          metrics.serviceStatus === 'unstable' ? 'text-yellow-400' :
          'text-red-400'
        }`} />
      </div>

      {/* Metrics Grid */}
      <div className="p-4 grid gap-4">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              metrics.serviceStatus === 'operational' ? 'bg-green-400' :
              metrics.serviceStatus === 'unstable' ? 'bg-yellow-400' :
              'bg-red-400'
            }`} />
            <span className="text-gray-400">Service Status</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-sm ${
            metrics.serviceStatus === 'operational' ? 'bg-green-500/10 text-green-400' :
            metrics.serviceStatus === 'unstable' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-red-500/10 text-red-400'
          }`}>
            {metrics.serviceStatus}
          </span>
        </div>

        {/* Network Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Network Latency</span>
          </div>
          <div className="flex items-center space-x-2">
            {metrics.networkLatency !== null ? (
              <span className={`text-sm ${
                metrics.networkLatency > 100 ? 'text-red-400' :
                metrics.networkLatency > 50 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {metrics.networkLatency} ms
              </span>
            ) : (
              <span className="text-sm text-gray-400">--</span>
            )}
          </div>
        </div>

        {/* Active VMs Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Active VMs</span>
          </div>
          <span className="text-gray-100">{metrics.activeVMs}</span>
        </div>

        {/* Connections Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Active Connections</span>
          </div>
          <span className="text-gray-100">{metrics.activeConnections}</span>
        </div>

        {/* Last Update */}
        {metrics.lastUpdate && (
          <div className="flex justify-end items-center text-xs pt-2 border-t border-gray-700">
            <span className="text-gray-500">
              Updated {Math.floor((Date.now() - metrics.lastUpdate) / 1000)}s ago
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealth;