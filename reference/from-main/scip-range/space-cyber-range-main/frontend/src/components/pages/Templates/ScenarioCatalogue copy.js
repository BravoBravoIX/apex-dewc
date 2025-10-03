import React, { useState } from 'react';
import { Server, Radio, MapPin, Clock } from 'lucide-react';

const scenarioData = [
  {
    id: 'sat-ground-link-001',
    name: 'Satellite Ground Link Training',
    category: 'Satellite Operations',
    difficulty: 'Intermediate',
    estimatedDuration: '2 hours',
    tags: ['RF Communication', 'Interference Mitigation']
  },
  {
    id: 'network-defense-002',
    name: 'Network Defense Scenario',
    category: 'Cybersecurity',
    difficulty: 'Advanced',
    estimatedDuration: '3 hours',
    tags: ['Threat Detection', 'Response']
  },
  {
    id: 'rf-jamming-003',
    name: 'RF Jamming Mitigation',
    category: 'Electronic Warfare',
    difficulty: 'Expert',
    estimatedDuration: '4 hours',
    tags: ['Signal Processing', 'Interference']
  }
];

const ScenarioCatalogue = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Scenario Catalogue</h3>
        <Server className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-3">
        {scenarioData.map((scenario) => (
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
                <div className={`px-2 py-1 rounded-full text-xs 
                  ${scenario.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 
                  scenario.difficulty === 'Advanced' ? 'bg-orange-500/20 text-orange-400' : 
                  'bg-red-500/20 text-red-400'}`}>
                  {scenario.difficulty}
                </div>
              </div>
            </div>
            
            <div className="mt-2 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2 text-gray-400">
                <Radio className="w-4 h-4" />
                <span>{scenario.category}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{scenario.estimatedDuration}</span>
              </div>
            </div>
            
            <div className="mt-3 flex space-x-2">
              {scenario.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-700 pt-4 text-center">
        <div className="text-sm text-gray-400">
          Total Scenarios: {scenarioData.length}
        </div>
      </div>
    </div>
  );
};

export default ScenarioCatalogue;