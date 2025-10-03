import React, { useState } from 'react';
import { Target, CheckCircle, Circle } from 'lucide-react';

const ScenarioObjectives = () => {
  const [selectedScenario, setSelectedScenario] = useState('sat-ground-link');

  const scenarios = {
    'sat-ground-link': {
      name: 'Satellite Ground Link Training',
      stages: [
        {
          name: 'Ground Station Setup',
          objectives: [
            { id: 'gs1', description: 'Configure Ground Station Parameters', completed: true },
            { id: 'gs2', description: 'Verify RF Chain', completed: true },
            { id: 'gs3', description: 'Initialize Tracking System', completed: false }
          ]
        },
        {
          name: 'Satellite Acquisition',
          objectives: [
            { id: 'sa1', description: 'Locate Satellite TLE', completed: true },
            { id: 'sa2', description: 'Calculate Pass Times', completed: false },
            { id: 'sa3', description: 'Establish Initial Contact', completed: false }
          ]
        }
      ]
    }
  };

  const currentScenario = scenarios[selectedScenario];

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Scenario Objectives</h3>
        <Target className="w-5 h-5 text-blue-500" />
      </div>
      
      <div>
        <h4 className="text-md font-medium text-gray-300 mb-2">{currentScenario.name}</h4>
        
        {currentScenario.stages.map((stage, stageIndex) => (
          <div key={stageIndex} className="mb-4">
            <div className="bg-gray-700 p-3 rounded-lg mb-2">
              <h5 className="text-sm font-semibold text-gray-100">{stage.name}</h5>
            </div>
            
            {stage.objectives.map((objective) => (
              <div 
                key={objective.id} 
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700"
              >
                {objective.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-sm ${
                  objective.completed ? 'text-gray-300 line-through' : 'text-gray-400'
                }`}>
                  {objective.description}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Overall Progress</span>
          <span className="text-gray-100">
            {(() => {
              const allObjectives = currentScenario.stages.flatMap(stage => stage.objectives);
              const completedObjectives = allObjectives.filter(obj => obj.completed);
              return `${completedObjectives.length}/${allObjectives.length}`}
            )()}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div 
            className="bg-blue-500 h-2 rounded-full" 
            style={{
              width: `${(() => {
                const allObjectives = currentScenario.stages.flatMap(stage => stage.objectives);
                const completedObjectives = allObjectives.filter(obj => obj.completed);
                return (completedObjectives.length / allObjectives.length) * 100;
              })()}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioObjectives;