import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Circle } from 'lucide-react';

const StageSection = ({ stage, stageId, expandedStages, onToggle }) => {
  return (
    <div className="bg-gray-700/50 rounded-lg">
      <button
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-600/50 rounded-lg transition-colors"
        onClick={() => onToggle(stageId)}
      >
        <div className="flex items-center space-x-3">
          {expandedStages.includes(stageId) ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-gray-100 font-medium">{stage.milestone}</span>
        </div>
        <div className="text-sm text-gray-400">
          {stage.triggers[0]}
        </div>
      </button>

      {expandedStages.includes(stageId) && (
        <div className="px-4 pb-3 space-y-2 ml-8">
          {stage.tasks.map((task, taskIndex) => (
            <div key={taskIndex} className="flex items-start space-x-3 group">
              <Circle className="w-4 h-4 mt-1 text-gray-500 group-hover:text-blue-400 transition-colors" />
              <div>
                <div className="text-sm text-gray-300">{task.name}</div>
                {task.description && (
                  <div className="text-xs text-gray-400 mt-1">
                    {task.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ScenarioDetails = ({ scenario }) => {
  const [expandedStages, setExpandedStages] = useState([]);

  // Reset expanded stages when scenario changes
  useEffect(() => {
    setExpandedStages([]);
  }, [scenario?.id]); // Reset only when scenario ID changes

  const toggleStage = (stageId) => {
    setExpandedStages(prev => 
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  if (!scenario) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 w-full space-y-4">
        <div className="text-gray-400 text-center py-4">
          No scenario selected
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 w-full space-y-4">
      <h2 className="text-xl font-semibold text-gray-100">{scenario.name}</h2>

      <div>
        <p className="text-gray-100">{scenario.description || 'No description available'}</p>
      </div>

      <div>
        <div className="text-sm text-gray-400 mb-1">Type</div>
        <div className="flex items-center space-x-2">
          <div
            className={`px-2 py-1 rounded-full text-xs ${
              scenario.type === 'satellite_operations'
                ? 'bg-blue-500/10 text-blue-400'
                : scenario.type === 'training'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}
          >
            {scenario.type.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm text-gray-400 mb-2">Scenario Timeline</div>
        <div className="space-y-2">
          {scenario.timeline.map((stage, index) => (
            <StageSection 
              key={`${scenario.id}-stage-${index}`}
              stage={stage} 
              stageId={`${scenario.id}-stage-${index}`}
              expandedStages={expandedStages}
              onToggle={toggleStage}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenarioDetails;
