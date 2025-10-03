import React from 'react';
import { Activity, Server, Database, Network } from 'lucide-react';

const SystemHealth = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">System Health</h3>
        <Activity className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Server className="w-5 h-5 text-green-500" />
            <span className="text-gray-300">Service Status</span>
          </div>
          <span className="text-green-400 text-sm">Operational</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-300">Database</span>
          </div>
          <span className="text-green-400 text-sm">Connected</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Network className="w-5 h-5 text-purple-500" />
            <span className="text-gray-300">Network Latency</span>
          </div>
          <span className="text-gray-100 text-sm">45 ms</span>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <div className="text-sm text-gray-400 text-center">
          Last Updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;