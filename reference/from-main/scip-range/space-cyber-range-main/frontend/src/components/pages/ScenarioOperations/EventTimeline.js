import React from 'react';
import { Clock, AlertCircle, CheckCircle, Info, User } from 'lucide-react';

const EventTimeline = ({ events }) => {
  // Mock events - will be replaced with MQTT events
  const mockEvents = [
    {
      id: 1,
      type: "system",
      severity: "info",
      timestamp: "10:30:15",
      message: "Scenario instance initialized",
      details: "All systems starting up"
    },
    {
      id: 2,
      type: "user",
      severity: "info",
      timestamp: "10:35:22",
      message: "Team Alpha started Ground Station configuration",
      user: "Instructor Smith"
    },
    {
      id: 3,
      type: "system",
      severity: "warning",
      timestamp: "10:40:18",
      message: "High CPU usage detected on RF Simulator",
      details: "CPU usage at 85%"
    },
    {
      id: 4,
      type: "system",
      severity: "success",
      timestamp: "10:42:30",
      message: "Team Beta completed initialization task",
      details: "All checks passed"
    }
  ];

  const getEventIcon = (type, severity) => {
    switch (severity) {
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'info':
        return type === 'user' ? 
          <User className="w-4 h-4 text-blue-400" /> : 
          <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Event Timeline</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {mockEvents.map(event => (
          <div key={event.id} className="flex items-start space-x-3">
            <div className="mt-1">
              {getEventIcon(event.type, event.severity)}
            </div>
            
            <div className="flex-1 bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-100">{event.message}</span>
                <span className="text-sm text-gray-400">{event.timestamp}</span>
              </div>
              
              {event.details && (
                <p className="text-sm text-gray-400 mt-1">{event.details}</p>
              )}
              
              {event.user && (
                <p className="text-sm text-gray-400 mt-1">By: {event.user}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventTimeline;
