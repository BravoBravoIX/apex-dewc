import React, { useState, useEffect } from 'react';
import ScenarioCatalog from './ScenarioCatalog';
import ScenarioDetails from './ScenarioDetails';
import ScenarioLaunch from './ScenarioLaunch';

const ScenarioManagement = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [transformedScenario, setTransformedScenario] = useState(null);

  const handleScenarioSelect = async (scenario) => {
    try {
      // Fetch full scenario details when selected
      const response = await fetch(`/api/scenarios/${scenario.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch scenario details: ${response.statusText}`);
      }
      
      const fullData = await response.json();
      const scenarioDef = fullData.scenario_definition;
      
      // Transform the data to match our component requirements
      const transformed = {
        id: scenarioDef.id,
        name: scenarioDef.name,
        description: scenarioDef.metadata.description,
        type: scenarioDef.category || 'training',
        // Transform stages into timeline format
        timeline: scenarioDef.stages.map(stage => ({
          milestone: stage.name,
          tasks: stage.tasks.map(task => ({
            name: task.task,
            description: task.description
          })),
          requirements: stage.tasks.map(task => ({
            name: task.task,
            completed: false
          })),
          triggers: [stage.completion_criteria]
        })),
        // Transform topology.assets into required format
        assets: Object.entries(scenarioDef.topology.assets).map(([key, value]) => ({
          type: key,
          count: 1, // Default to 1, or calculate based on your needs
          description: value.description,
          requirements: value.resource_requirements
        }))
      };

      setSelectedScenario(scenario);
      setTransformedScenario(transformed);
    } catch (error) {
      console.error('Error loading scenario details:', error);
      // Optionally add error state handling here
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Scenario Management</h1>
      <div className="flex space-x-6">
        <ScenarioCatalog 
          onScenarioSelect={handleScenarioSelect}
        />
        {transformedScenario && (
          <div className="w-2/3 space-y-6">
            <ScenarioDetails scenario={transformedScenario} />
            <ScenarioLaunch scenario={transformedScenario} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ScenarioManagement;
