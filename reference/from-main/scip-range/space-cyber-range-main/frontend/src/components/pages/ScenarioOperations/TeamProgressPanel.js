import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Circle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import mqtt from 'mqtt';

const TeamProgressPanel = ({ onTeamSelect }) => {
  const [teams, setTeams] = useState([]);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [activeScenario, setActiveScenario] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial active scenario
  useEffect(() => {
    const fetchActiveScenario = async () => {
      try {
        const response = await fetch('/api/scenarios/active');
        const data = await response.json();
        
        if (data.active !== false) {
          setActiveScenario(data);
          
          // Fetch initial instances
          const instancesResponse = await fetch(`/api/scenarios/${data.scenario_id}/instances`);
          if (instancesResponse.ok) {
            const instancesData = await instancesResponse.json();
            setTeams(instancesData.instances || []);
          }
        }
      } catch (error) {
        console.error('Error fetching scenario data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveScenario();
  }, []);

  // MQTT subscription
  useEffect(() => {
    if (!activeScenario?.scenario_id) return;

    console.log('Setting up MQTT for team progress...');
    const clientId = `teamProgress_${Math.random().toString(16).slice(2)}`;
    const client = mqtt.connect(`ws://${window.location.hostname}:9001/mqtt`, {
      clientId,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      console.log('Connected to MQTT (TeamProgress)');
      const topic = `range/scenarios/${activeScenario.scenario_id}/instances/+/status`;
      console.log('Subscribing to:', topic);
      client.subscribe(topic);
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received team update:', data);

        setTeams(prev => {
          const existingIndex = prev.findIndex(t => t.team_id === data.team_id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...data
            };
            return updated;
          }
          return [...prev, data];
        });
      } catch (error) {
        console.error('Error processing team update:', error);
      }
    });

    return () => {
      console.log('Cleaning up MQTT connection...');
      client.end();
    };
  }, [activeScenario?.scenario_id]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0h 0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleTeamClick = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
    onTeamSelect?.(teamId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-gray-400 text-center">Loading team progress...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Team Progress</h3>
        <Users className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {teams.map(team => (
          <div key={team.team_id} className="bg-gray-750 rounded-lg overflow-hidden">
            {/* Team Header - Always visible */}
            <div 
              className={`p-4 cursor-pointer hover:bg-gray-700 transition-colors ${
                expandedTeam === team.team_id ? 'bg-gray-700' : ''
              }`}
              onClick={() => handleTeamClick(team.team_id)}
            >
              <div className="flex items-center space-x-4">
                {/* Expand/Collapse Icon */}
                {expandedTeam === team.team_id ? 
                  <ChevronDown className="w-5 h-5 text-gray-400" /> :
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                }
                
                {/* Team Name and Current Stage */}
                <div className="flex-1">
                  <h4 className="text-gray-100 font-medium">{team.team_name}</h4>
                  <p className="text-sm text-gray-400">Current Stage: {team.current_stage}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-48 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${team.progress || 0}%` }}
                  />
                </div>

                {/* Progress Percentage and Time */}
                <div className="flex items-center space-x-4 min-w-[180px] text-right">
                  <div>
                    <div className="text-gray-100">{Math.round(team.progress || 0)}%</div>
                    <div className="text-sm text-gray-400">Progress</div>
                  </div>
                  <div>
                    <div className="text-gray-100">{formatDuration(team.active_time)}</div>
                    <div className="text-sm text-gray-400">Active Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable Task List */}
            {expandedTeam === team.team_id && team.tasks && (
              <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="space-y-3">
                  {team.tasks.map((task, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className="ml-2 text-gray-100">{task.name}</span>
                      </div>
                      <span className="text-sm text-gray-400 capitalize">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {teams.length === 0 && (
          <div className="text-gray-400 text-center py-4">
            No active teams
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamProgressPanel;