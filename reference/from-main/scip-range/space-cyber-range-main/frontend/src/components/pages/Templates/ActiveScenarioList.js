import React, { useState, useEffect } from 'react';
import { Users, Activity, Clock } from 'lucide-react';
import mqtt from 'mqtt';

const STATUS = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
};

const ActiveInstances = () => {
  const [instances, setInstances] = useState({});

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001'); // Ensure your MQTT broker supports WebSockets on this port

    client.on('connect', () => {
      console.log('Connected to MQTT for instances');
      client.subscribe('instance/+/status');
      client.subscribe('instance/+/task_complete');
    });

    client.on('message', (topic, message) => {
      const topicParts = topic.split('/');
      if (topicParts.length < 3) return;
      const [, instanceId, messageType] = topicParts;

      try {
        const data = JSON.parse(message.toString());

        setInstances((prev) => {
          const existingInstance = prev[instanceId] || {};
          let updatedInstance = { ...existingInstance };

          if (messageType === 'status') {
            updatedInstance = {
              ...updatedInstance,
              ...data,
              lastUpdate: Date.now(),
              status: data.status === 'completed' ? STATUS.COMPLETED : STATUS.ACTIVE,
            };
          }

          if (messageType === 'task_complete') {
            const { completed_tasks, total_tasks } = data;
            updatedInstance.completed_tasks = completed_tasks;
            updatedInstance.total_tasks = total_tasks;
            updatedInstance.progress = total_tasks > 0
              ? Math.round((completed_tasks / total_tasks) * 100)
              : 0;
            updatedInstance.lastUpdate = Date.now();
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

  const calculateElapsedTime = (startTime) => {
    if (!startTime) return '0h 0m';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const instancesArray = Object.values(instances);

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">Team Progress</h3>
        <Users className="w-5 h-5 text-blue-500" />
      </div>

      {/* Instances List */}
      <div className="space-y-4">
        {instancesArray.length === 0 ? (
          <div className="text-gray-400">No active teams.</div>
        ) : (
          instancesArray.map((instance, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="text-md font-medium text-gray-100">{instance.team_id || 'Unknown Team'}</h4>
                  <span className="text-xs text-gray-400">{instance.total_members || 3} members</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    instance.status === STATUS.ACTIVE
                      ? 'bg-green-500/20 text-green-400'
                      : instance.status === STATUS.PAUSED
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {instance.status}
                </span>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{instance.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${instance.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{calculateElapsedTime(instance.start_time)}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>Ongoing</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 pt-4 text-center">
        <div className="text-sm text-gray-400">
          Total Teams: {instancesArray.length}
        </div>
      </div>
    </div>
  );
};

export default ActiveInstances;
