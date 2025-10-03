import React from 'react';
import { Target, CheckCircle, Clock } from 'lucide-react';

const StageProgressTracker = () => {
  const scenarioStages = [
    {
      name: 'Ground Station Setup',
      status: 'completed',
      startTime: '2024-01-06T10:30:00Z',
      endTime: '2024-01-06T11:00:00Z',
      tasks: 3,
      completedTasks: 3
    },
    {
      name: 'Satellite Acquisition',
      status: 'in-progress',
      startTime: '2024-01-06T11:00:00Z',
      tasks: 3,
      completedTasks: 2
    },
    {
      name: 'Communications',
      status: 'pending',
      tasks: 3,
      completedTasks: 0
    },
    {
      name: 'Interference Management',
      status: 'pending',
      tasks: 3,
      completedTasks: 0
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Stage Progress</h3>
        <Target className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        {scenarioStages.map((stage, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium text-gray-100">{stage.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(stage.status)}`}>
                {stage.status.replace('-', ' ')}
              </span>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Tasks Completed</span>
                <span>{stage.completedTasks}/{stage.tasks}</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{width: `${(stage.completedTasks / stage.tasks) * 100}%`}}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>
                  {stage.startTime 
                    ? new Date(stage.startTime).toLocaleTimeString() 
                    : 'Not Started'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <CheckCircle className="w-4 h-4" />
                <span>
                  {stage.endTime 
                    ? new Date(stage.endTime).toLocaleTimeString() 
                    : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-700 pt-4 text-center">
        <div className="text-sm text-gray-400">
          Overall Progress: {
            Math.round(
              (scenarioStages.reduce((sum, stage) => sum + stage.completedTasks, 0) / 
               (scenarioStages.length * scenarioStages[0].tasks)) * 100
            )
          }%
        </div>
      </div>
    </div>
  );
};

export default StageProgressTracker;