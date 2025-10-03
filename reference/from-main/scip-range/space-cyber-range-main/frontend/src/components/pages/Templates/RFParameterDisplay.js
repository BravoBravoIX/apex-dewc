import React from 'react';
import { Radio, Signal, Sliders } from 'lucide-react';

const RFParameterDisplay = () => {
  const rfParameters = {
    frequencyBand: 'S-Band',
    centerFrequency: 2200,
    bandwidth: 20,
    signalPower: -30,
    noiseFloor: -120,
    modulationType: 'QPSK',
    pathLoss: 180
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">RF Parameters</h3>
        <Radio className="w-5 h-5 text-blue-500" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Frequency Band</span>
            <Signal className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-sm text-gray-100">{rfParameters.frequencyBand}</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Center Frequency</span>
            <Sliders className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-sm text-gray-100">{rfParameters.centerFrequency} MHz</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Bandwidth</span>
            <Sliders className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-sm text-gray-100">{rfParameters.bandwidth} MHz</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Signal Power</span>
            <Signal className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-sm text-gray-100">{rfParameters.signalPower} dBm</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Noise Floor</span>
            <Signal className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-sm text-gray-100">{rfParameters.noiseFloor} dBm</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Modulation</span>
            <Radio className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-sm text-gray-100">{rfParameters.modulationType}</div>
        </div>
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <div className="flex justify-between">
          <div className="text-center flex-1">
            <div className="text-xs text-gray-400">Path Loss</div>
            <div className="text-sm text-gray-100">{rfParameters.pathLoss} dB</div>
          </div>
          <div className="text-center flex-1 border-l border-gray-700">
            <div className="text-xs text-gray-400">SNR</div>
            <div className="text-sm text-gray-100">
              {rfParameters.signalPower - rfParameters.noiseFloor} dB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFParameterDisplay;