import React from 'react';
import { Users, Activity, Clock } from 'lucide-react';

const TeamProgress = () => {
  const teams = [
    {
      name: 'Team Alpha',
      members: 3,
      progress: 65,
      timeElapsed: '1h 45m',
      status: 'Active'
    },
    {
      name: 'Team Beta',
      members: 2,
      progress: 35,
      timeElapsed: '1h 15m',
      status: 'Paused'
    }
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Team Progress</h3>
        <Users className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        {teams.map((team, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-md font-medium text-gray-100">{team.name}</h4>
                <span className="text-xs text-gray-400">{team.members} members</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                team.status === 'Active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {team.status}
              </span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{team.progress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{width: `${team.progress}%`}}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{team.timeElapsed}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Activity className="w-4 h-4" />
                <span>Ongoing</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-700 pt-4 text-center">
        <div className="text-sm text-gray-400">
          Total Teams: {teams.length}
        </div>
      </div>
    </div>
  );
};

export default TeamProgress;