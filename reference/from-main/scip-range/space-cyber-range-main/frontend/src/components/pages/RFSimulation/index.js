import React from 'react';
import ChannelSimulatorInfo from './ChannelSimulatorInfo';
import ChannelEffectsConfig from './ChannelEffectsConfig';

const RFSimulation = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">RF Channel Simulator</h1>

      {/* Two-column layout with 2/3 - 1/3 split */}
      <div className="flex gap-6">
        {/* Description Component - 2/3 width */}
        <div className="w-2/3">
          <ChannelSimulatorInfo />
        </div>

        {/* Configuration Display Component - 1/3 width */}
        <div className="w-1/3">
          <ChannelEffectsConfig />
        </div>
      </div>
    </div>
  );
};

export default RFSimulation;
