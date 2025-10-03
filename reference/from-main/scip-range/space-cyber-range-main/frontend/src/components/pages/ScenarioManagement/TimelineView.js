import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const TimelineView = ({ timeline }) => {
  return (
    <div className="space-y-3">
      {timeline.map((stage, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {stage.requirements.every(req => req.completed) ? (
              <CheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-gray-100 font-medium">{stage.milestone}</div>
            <div className="text-sm text-gray-400">
              Requirements: {stage.requirements.map(req => req.name).join(', ')}
            </div>
          </div>
          <div className="flex-shrink-0 text-sm text-gray-400">
            Triggers: {stage.triggers.join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;
