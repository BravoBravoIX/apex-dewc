import React from 'react';
import { Cpu, Database, Server } from 'lucide-react';

const ResourceUtilisation = () => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Resource Usage</h3>
        <Server className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-green-500" />
              <span className="text-gray-300">CPU</span>
            </div>
            <span className="text-gray-100">55%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{width: '55%'}}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-300">Memory</span>
            </div>
            <span className="text-gray-100">8.0 / 16 GB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full" style={{width: '50%'}}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-500" />
              <span className="text-gray-300">Storage</span>
            </div>
            <span className="text-gray-100">448 / 1024 GB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{width: '44%'}}></div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-gray-400">Network</div>
            <div className="text-sm text-gray-100">450 Mbps</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Connections</div>
            <div className="text-sm text-gray-100">24</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">Latency</div>
            <div className="text-sm text-gray-100">45 ms</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceUtilisation;