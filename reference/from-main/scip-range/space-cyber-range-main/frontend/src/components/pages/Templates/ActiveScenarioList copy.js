import React, { useState } from 'react';
import { Box, Play, Pause, Server, Clock } from 'lucide-react';

const activeScenarios = [
  {
    id: 'scenario-1',
    name: 'Satellite Ground Link',
    team: 'Team Alpha',
    status: 'running',
    startTime: '2024-01-06T10:30:00Z',
    progress: 60
  },
  {
    id: 'scenario-2',
    name: 'Network Defense',
    team: 'Team Beta',
    status: 'paused',
    startTime: '2024-01-06T11:15:00Z',
    progress: 35
  }
];

const ActiveScenarioList = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);

  const calculateElapsedTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Active Scenarios</h3>
        <Box className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        {activeScenarios.map((scenario) => (
          <div 
            key={scenario.id}
            className={`p-4 rounded-lg cursor-pointer transition-all duration-200 
              ${selectedScenario === scenario.id 
                ? 'bg-blue-900/30 border border-blue-500' 
                : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setSelectedScenario(scenario.id)}
          >
            <div className="flex justify-between items-center">
              <h4 className="text-md font-medium text-gray-100">{scenario.name}</h4>
              <div className="flex items-center space-x-2">
                {scenario.status === 'running' ? (
                  <Play className="w-4 h-4 text-green-500" />
                ) : (
                  <Pause className="w-4 h-4 text-yellow-500" />
                )}
                <span className={`px-2 py-1 rounded-full text-xs ${
                  scenario.status === 'running' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {scenario.status}
                </span>
              </div>
            </div>
            
            <div className="mt-2 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2 text-gray-400">
                <Server className="w-4 h-4" />
                <span>{scenario.team}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{calculateElapsedTime(scenario.startTime)}</span>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{scenario.progress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{width: `${scenario.progress}%`}}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-700 pt-4 text-center">
        <div className="text-sm text-gray-400">
          Total Active Scenarios: {activeScenarios.length}
        </div>
      </div>
    </div>
  );
};

export default ActiveScenarioList;