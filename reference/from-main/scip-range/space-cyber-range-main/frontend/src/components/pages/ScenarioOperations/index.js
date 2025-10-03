import React, { useState, useEffect } from 'react';
import ActiveScenarioHeader from './ActiveScenarioHeader';
import TeamProgressPanel from './TeamProgressPanel';
import AssetHealthMonitor from './AssetHealthMonitor';
import EventTimeline from './EventTimeline';

const ScenarioOperations = () => {
  const [activeScenario, setActiveScenario] = useState(null);
  const [teamProgress, setTeamProgress] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [assetHealth, setAssetHealth] = useState({});
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Will implement MQTT subscriptions here
    // Topics from range/instance/{instance_id}/
    // - status, progress
    // - stages/current
    // - assets/*
    // - teams/*
    // - events/*
  }, []);

  const handleTeamSelect = (teamId) => {
    setSelectedTeam(teamId);
    // Here we'll eventually filter asset health based on team
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Scenario Operations</h1>
      
      {/* Active Scenario Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <ActiveScenarioHeader 
          scenario={activeScenario}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Team Progress Panel - Takes 8 columns */}
        <div className="col-span-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <TeamProgressPanel 
              progress={teamProgress}
              onTeamSelect={handleTeamSelect}
            />
          </div>
        </div>

        {/* Asset Health Monitor - Takes 4 columns */}
        <div className="col-span-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <AssetHealthMonitor 
              health={assetHealth}
              teamId={selectedTeam}
            />
          </div>
        </div>
      </div>

      {/* Event Timeline - Full Width */}
      <div className="bg-gray-800 rounded-lg p-6">
        <EventTimeline 
          events={events}
          teamId={selectedTeam}
        />
      </div>
    </div>
  );
};

export default ScenarioOperations;
