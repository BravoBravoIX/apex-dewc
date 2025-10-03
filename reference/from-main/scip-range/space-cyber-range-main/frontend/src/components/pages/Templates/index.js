import React from 'react';
import SystemHealth from './SystemHealth';
import ActiveInstancesCount from './ActiveInstancesCount';
import ResourceUtilisation from './ResourceUtilisation';
import ScenarioCatalogue from './ScenarioCatalogue';
import ScenarioDetails from './ScenarioDetails';
import ScenarioLaunchControls from './ScenarioLaunchControls';
import ActiveScenarioList from './ActiveScenarioList';
import ScenarioObjectives from './ScenarioObjectives';
import TeamProgress from './TeamProgress';
import InstanceControls from './InstanceControls';
import TopologyVisualisation from './TopologyVisualisation';
import RFParameterDisplay from './RFParameterDisplay';
import StageProgressTracker from './StageProgressTracker';

const Templates = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Component Templates</h1>
      
      <h2 className="text-xl font-semibold text-gray-200">Range Status</h2>
      <div className="grid grid-cols-3 gap-6">
        <SystemHealth />
        <ActiveInstancesCount />
        <ResourceUtilisation />
      </div>

      <h2 className="text-xl font-semibold text-gray-200">Scenarios</h2>
      <div className="grid grid-cols-3 gap-6">
        <ScenarioCatalogue />
        <ScenarioDetails />
        <ScenarioLaunchControls />
      </div>

      <h2 className="text-xl font-semibold text-gray-200">Active Scenario Management</h2>
      <div className="grid grid-cols-4 gap-6">
        <ActiveScenarioList />
        <ScenarioObjectives />
        <TeamProgress />
        <InstanceControls />
      </div>

      <h2 className="text-xl font-semibold text-gray-200">Utility Components</h2>
      <div className="grid grid-cols-3 gap-6">
        <TopologyVisualisation />
        <RFParameterDisplay />
        <StageProgressTracker />
      </div>
    </div>
  );
};

export default Templates;