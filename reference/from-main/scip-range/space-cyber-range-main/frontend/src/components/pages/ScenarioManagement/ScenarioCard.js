import React from 'react';

const ScenarioCard = ({ scenario, onSelect }) => {
  // Extract category for styling if available, default to 'training'
  const type = scenario.category?.toLowerCase() || 'training';
  
  const getTypeStyle = (type) => {
    switch (type) {
      case 'satellite_operations':
        return 'bg-blue-500/10 text-blue-400';
      case 'training':
        return 'bg-green-500/10 text-green-400';
      case 'assessment':
        return 'bg-yellow-500/10 text-yellow-400';
      default:
        return 'bg-purple-500/10 text-purple-400';
    }
  };

  const handleCardClick = () => {
    onSelect(scenario);
  };

  return (
    <div
      className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-650 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="text-gray-100 font-medium">{scenario.name}</div>
        <div
          className={`px-2 py-1 rounded-full text-xs ${getTypeStyle(type)}`}
        >
          {type.replace('_', ' ')}
        </div>
      </div>
      <p className="text-gray-400 mt-2 text-sm">
        {scenario.description || 'No description available'}
      </p>
    </div>
  );
};

export default ScenarioCard;
