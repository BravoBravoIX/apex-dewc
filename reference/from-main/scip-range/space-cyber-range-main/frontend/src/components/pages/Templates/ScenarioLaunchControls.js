import React, { useState } from 'react';
import { Play, Settings, Server, Sliders } from 'lucide-react';

const ScenarioLaunchControls = () => {
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  const teams = [
    { id: 'team-alpha', name: 'Team Alpha', members: 3 },
    { id: 'team-beta', name: 'Team Beta', members: 2 },
    { id: 'team-gamma', name: 'Team Gamma', members: 4 }
  ];

  const instanceConfigurations = [
    { 
      cpu: 2, 
      memory: 4, 
      storage: 20, 
      network: 'Isolated',
      difficulty: 'Standard'
    }
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Scenario Launch</h3>
        <Server className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <h4 className="text-md font-medium text-gray-300">Team Selection</h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {teams.map((team) => (
              <div 
                key={team.id}
                className={`p-3 rounded-lg cursor-pointer transition-all 
                  ${selectedTeam === team.id 
                    ? 'bg-blue-900/30 border border-blue-500' 
                    : 'bg-gray-700 hover:bg-gray-600'}`}
                onClick={() => setSelectedTeam(team.id)}
              >
                <div className="text-sm font-medium text-gray-100">{team.name}</div>
                <div className="text-xs text-gray-400 mt-1">{team.members} members</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Sliders className="w-4 h-4 text-gray-400" />
            <h4 className="text-md font-medium text-gray-300">Instance Configuration</h4>
          </div>
          {instanceConfigurations.map((config, index) => (
            <div 
              key={index} 
              className="bg-gray-700 p-4 rounded-lg space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-400">CPU Cores</span>
                  <div className="text-sm text-gray-100">{config.cpu}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Memory</span>
                  <div className="text-sm text-gray-100">{config.memory} GB</div>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Storage</span>
                  <div className="text-sm text-gray-100">{config.storage} GB</div>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Network</span>
                  <div className="text-sm text-gray-100">{config.network}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <button 
          className="w-full flex items-center justify-center space-x-2 
            bg-blue-600 text-white py-2 rounded-lg 
            hover:bg-blue-700 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedTeam}
        >
          <Play className="w-5 h-5" />
          <span>Launch Scenario</span>
        </button>
      </div>
    </div>
  );
};

export default ScenarioLaunchControls;