import React from 'react';
import { Settings, AlertCircle } from 'lucide-react';

const ConfigSection = ({ title, items }) => (
  <div className="bg-gray-750 p-3 rounded-lg">
    <h3 className="text-gray-100 font-medium mb-2 text-sm">{title}</h3>
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between text-xs">
          <span className="text-gray-400">{item.label}</span>
          <span className="text-gray-100">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const ChannelEffectsConfig = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-blue-400" />
        <h2 className="text-lg font-semibold text-gray-100">Current Configuration</h2>
      </div>

      <div className="space-y-3">
        <ConfigSection
          title="AWGN Parameters"
          items={[
            { label: 'Status', value: 'Enabled' },
            { label: 'SNR', value: '20 dB' }
          ]}
        />

        <ConfigSection
          title="Fading Parameters"
          items={[
            { label: 'Status', value: 'Enabled' },
            { label: 'Type', value: 'Rayleigh' },
            { label: 'Rician K-factor', value: '10' }
          ]}
        />

        <ConfigSection
          title="Doppler Parameters"
          items={[
            { label: 'Status', value: 'Enabled' },
            { label: 'Shift', value: '100 Hz' }
          ]}
        />

        <ConfigSection
          title="Path Loss Parameters"
          items={[
            { label: 'Status', value: 'Enabled' },
            { label: 'Model', value: 'Free Space' },
            { label: 'Frequency', value: '2 GHz' },
            { label: 'Distance', value: '7000 km' }
          ]}
        />

        <ConfigSection
          title="Atmospheric Parameters"
          items={[
            { label: 'Status', value: 'Enabled' },
            { label: 'Rain Fade', value: '5 dB' },
            { label: 'Humidity', value: '50%' }
          ]}
        />

        <ConfigSection
          title="Multipath Parameters"
          items={[
            { label: 'Status', value: 'Enabled' },
            { label: 'Paths', value: '3' },
            { label: 'Delays', value: '[0, 1µs, 2µs]' },
            { label: 'Gains', value: '[0, -3, -6] dB' }
          ]}
        />

        <ConfigSection
          title="Additional Parameters"
          items={[
            { label: 'Frequency Offset', value: '50 Hz' },
            { label: 'Phase Noise', value: '-80 dBc/Hz' }
          ]}
        />
      </div>

      <div className="mt-4 flex items-start gap-2 bg-blue-500/10 p-3 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5" />
        <p className="text-xs text-blue-300">
          Parameters can be adjusted via the configuration file.
        </p>
      </div>
    </div>
  );
};

export default ChannelEffectsConfig;
