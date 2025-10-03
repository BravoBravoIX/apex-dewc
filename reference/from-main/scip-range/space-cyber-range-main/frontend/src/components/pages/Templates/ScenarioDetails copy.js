import React from 'react';
import { Server, Target, Clock, Book } from 'lucide-react';

const ScenarioDetails = () => {
  const scenario = {
    name: 'Satellite Ground Link Training',
    description: 'Training scenario for establishing and maintaining satellite communications while handling interference',
    learningObjectives: [
      'Configure ground station for satellite communication',
      'Establish and maintain satellite links',
      'Identify and mitigate RF interference',
      'Perform basic satellite operations'
    ],
    prerequisites: [
      'Basic RF knowledge',
      'Satellite operations fundamentals',
      'Ground station operations experience'
    ],
    topology: {
      assets: ['Ground Station', 'Satellite VM', 'RF Simulator'],
      connections: ['Uplink', 'Downlink']
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Scenario Details</h3>
        <Server className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Book className="w-4 h-4 text-gray-400" />
            <h4 className="text-md font-medium text-gray-300">Description</h4>
          </div>
          <p className="text-gray-400 text-sm">{scenario.description}</p>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-green-500" />
            <h4 className="text-md font-medium text-gray-300">Learning Objectives</h4>
          </div>
          <ul className="space-y-1 text-sm text-gray-400 pl-4">
            {scenario.learningObjectives.map((objective, index) => (
              <li key={index} className="list-disc">{objective}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <h4 className="text-md font-medium text-gray-300">Prerequisites</h4>
          </div>
          <ul className="space-y-1 text-sm text-gray-400 pl-4">
            {scenario.prerequisites.map((prereq, index) => (
              <li key={index} className="list-disc">{prereq}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Server className="w-4 h-4 text-purple-500" />
            <h4 className="text-md font-medium text-gray-300">Topology</h4>
          </div>
          <div className="bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between">
              <div>
                <span className="text-sm text-gray-400">Assets:</span>
                <div className="flex space-x-2 mt-1">
                  {scenario.topology.assets.map((asset, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs">
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400">Connections:</span>
                <div className="flex space-x-2 mt-1">
                  {scenario.topology.connections.map((connection, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs">
                      {connection}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioDetails;