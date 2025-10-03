import React from 'react';
import { Server, Satellite, Network, Database } from 'lucide-react';

const TopologyVisualisation = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Scenario Topology</h3>
        <Network className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="relative h-64 bg-gray-900 rounded-lg p-4">
        {/* DMS/Central Node */}
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <Database className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-300 mt-2">DMS</span>
          </div>
        </div>

        {/* Satellites */}
        <div className="absolute bottom-1/4 left-1/4 transform -translate-x-1/2">
          <div className="flex flex-col items-center">
            <div className="bg-purple-600 p-3 rounded-full">
              <Satellite className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-300 mt-2">Satellite 1</span>
          </div>
        </div>

        <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2">
          <div className="flex flex-col items-center">
            <div className="bg-purple-600 p-3 rounded-full">
              <Satellite className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-300 mt-2">Satellite 2</span>
          </div>
        </div>

        {/* Ground Station */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center">
            <div className="bg-green-600 p-3 rounded-full">
              <Server className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-gray-300 mt-2">Ground Station</span>
          </div>
        </div>

        {/* Connecting Lines */}
        <svg className="absolute inset-0 pointer-events-none">
          <line 
            x1="50%" 
            y1="25%" 
            x2="25%" 
            y2="75%" 
            stroke="#4B5563" 
            strokeWidth="2" 
            strokeDasharray="4"
          />
          <line 
            x1="50%" 
            y1="25%" 
            x2="75%" 
            y2="75%" 
            stroke="#4B5563" 
            strokeWidth="2" 
            strokeDasharray="4"
          />
          <line 
            x1="25%" 
            y1="75%" 
            x2="50%" 
            y2="90%" 
            stroke="#4B5563" 
            strokeWidth="2" 
            strokeDasharray="4"
          />
          <line 
            x1="75%" 
            y1="75%" 
            x2="50%" 
            y2="90%" 
            stroke="#4B5563" 
            strokeWidth="2" 
            strokeDasharray="4"
          />
        </svg>
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-gray-400">Nodes</div>
            <div className="text-sm text-gray-100">4</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Connections</div>
            <div className="text-sm text-gray-100">6</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Network Type</div>
            <div className="text-sm text-gray-100">Mesh</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopologyVisualisation;