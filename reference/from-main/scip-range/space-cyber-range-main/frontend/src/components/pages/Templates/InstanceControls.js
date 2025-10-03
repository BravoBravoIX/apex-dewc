import React, { useState } from 'react';
import { Server, Play, Pause, Square, RefreshCw, Power } from 'lucide-react';

const InstanceControls = () => {
  const [instances, setInstances] = useState([
    {
      id: 'instance-001',
      name: 'Satellite Ground Link',
      team: 'Team Alpha',
      status: 'running'
    },
    {
      id: 'instance-002',
      name: 'Network Defense',
      team: 'Team Beta', 
      status: 'paused'
    }
  ]);

  const handleInstanceAction = (instanceId, action) => {
    setInstances(instances.map(instance => 
      instance.id === instanceId 
        ? { ...instance, status: action }
        : instance
    ));
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Instance Controls</h3>
        <Server className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        {instances.map((instance) => (
          <div 
            key={instance.id} 
            className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <h4 className="text-md font-medium text-gray-100">{instance.name}</h4>
              <p className="text-sm text-gray-400">{instance.team}</p>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className={`p-2 rounded-lg ${
                  instance.status === 'running' 
                    ? 'bg-gray-600 text-gray-300 cursor-default' 
                    : 'hover:bg-green-600 bg-green-500/20 text-green-400'
                }`}
                onClick={() => handleInstanceAction(instance.id, 'running')}
                disabled={instance.status === 'running'}
              >
                <Play className="w-4 h-4" />
              </button>
              
              <button 
                className={`p-2 rounded-lg ${
                  instance.status === 'paused' 
                    ? 'bg-gray-600 text-gray-300 cursor-default' 
                    : 'hover:bg-yellow-600 bg-yellow-500/20 text-yellow-400'
                }`}
                onClick={() => handleInstanceAction(instance.id, 'paused')}
                disabled={instance.status === 'paused'}
              >
                <Pause className="w-4 h-4" />
              </button>
              
              <button 
                className="p-2 hover:bg-red-600 bg-red-500/20 text-red-400 rounded-lg"
                onClick={() => handleInstanceAction(instance.id, 'stopped')}
              >
                <Square className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
        <div className="text-sm text-gray-400">
          Total Instances: {instances.length}
        </div>
        <button className="flex items-center space-x-2 text-sm text-gray-300 hover:text-gray-100">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
};

export default InstanceControls;