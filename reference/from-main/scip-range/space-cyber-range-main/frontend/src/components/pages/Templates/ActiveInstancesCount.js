import React from 'react';
import { Box, Play, Pause, Server } from 'lucide-react';

const ActiveInstancesCount = () => {
  const totalInstances = 5;
  const activeInstances = 3;
  const pausedInstances = 1;
  const inactiveInstances = 1;

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Active Scenarios</h3>
        <Box className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Play className="w-4 h-4 text-green-500" />
            <span className="text-gray-300">Active</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{activeInstances}</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Pause className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-300">Paused</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{pausedInstances}</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">Total Instances</span>
          </div>
          <span className="text-gray-100">{totalInstances}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-red-400" />
            <span className="text-gray-300">Inactive</span>
          </div>
          <span className="text-red-400">{inactiveInstances}</span>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-4 text-center">
        <div className="text-sm text-gray-400">
          Total Running: {activeInstances}/{totalInstances}
        </div>
      </div>
    </div>
  );
};

export default ActiveInstancesCount;