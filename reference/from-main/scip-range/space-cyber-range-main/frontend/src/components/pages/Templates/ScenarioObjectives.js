import React, { useState, useEffect } from 'react';
import { Target, CheckCircle, Circle } from 'lucide-react';
import mqtt from 'mqtt';

const ScenarioObjectives = () => {
  const [instances, setInstances] = useState({});
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');

    client.on('connect', () => {
      console.log('Connected to MQTT for objectives');
      client.subscribe('instance/+/stage');
      client.subscribe('instance/+/status');
    });

    client.on('message', (topic, message) => {
      const topicParts = topic.split('/');
      if (topicParts.length < 3) return;
      const [, instanceId, messageType] = topicParts;

      try {
        const data = JSON.parse(message.toString());

        setInstances((prev) => {
          const existingInstance = prev[instanceId] || { stages: [] };
          let updatedInstance = { ...existingInstance };

          // Handle stage updates
          if (messageType === 'stage') {
            const stageExists = updatedInstance.stages.some(
              (stage) => stage.stage_name === data.stage_name
            );

            if (!stageExists) {
              updatedInstance.stages = [
                ...updatedInstance.stages,
                {
                  stage_name: data.stage_name,
                  description: data.description,
                  completion_criteria: data.completion_criteria,
                  completed: data.completed,
                },
              ];
            } else {
              updatedInstance.stages = updatedInstance.stages.map((stage) =>
                stage.stage_name === data.stage_name ? { ...stage, completed: data.completed } : stage
              );
            }
          }

          // Handle status updates
          if (messageType === 'status') {
            updatedInstance = { ...updatedInstance, ...data };
          }

          return {
            ...prev,
            [instanceId]: updatedInstance,
          };
        });
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const selectedInstance = selectedInstanceId ? instances[selectedInstanceId] : null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Scenario Objectives</h3>
        <Target className="w-5 h-5 text-blue-500" />
      </div>

      {/* Team Selector */}
      <div className="flex space-x-2 mb-4">
        {Object.keys(instances).map((instanceId) => (
          <button
            key={instanceId}
            onClick={() => setSelectedInstanceId(instanceId)}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              instanceId === selectedInstanceId
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {instances[instanceId]?.team_id || 'Unknown Team'}
          </button>
        ))}
      </div>

      {/* Scenario Content */}
      {selectedInstance ? (
        <>
          <h4 className="text-md font-medium text-gray-300 mb-2">{selectedInstance.scenario_name}</h4>
          {selectedInstance.stages?.length > 0 ? (
            selectedInstance.stages.map((stage, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg mb-2">
                <div className="flex justify-between items-center">
                  <h5 className="text-sm font-semibold text-gray-100">{stage.stage_name}</h5>
                  {stage.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <p className="text-sm text-gray-400">{stage.description}</p>
                <p className="text-xs text-gray-500 mt-1">Criteria: {stage.completion_criteria}</p>
              </div>
            ))
          ) : (
            <div className="text-gray-400">No stages found for this team.</div>
          )}

          {/* Overall Progress */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Overall Progress</span>
              <span className="text-gray-100">
                {(() => {
                  const completed = selectedInstance.stages?.filter((stage) => stage.completed).length || 0;
                  const total = selectedInstance.stages?.length || 0;
                  return `${completed}/${total}`;
                })()}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${(() => {
                    const completed = selectedInstance.stages?.filter((stage) => stage.completed).length || 0;
                    const total = selectedInstance.stages?.length || 0;
                    return total > 0 ? (completed / total) * 100 : 0;
                  })()}%`,
                }}
              ></div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-gray-400">Select a team to view its objectives.</div>
      )}
    </div>
  );
};

export default ScenarioObjectives;
