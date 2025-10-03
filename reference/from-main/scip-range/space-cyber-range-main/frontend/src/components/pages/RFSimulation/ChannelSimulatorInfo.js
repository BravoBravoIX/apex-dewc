import React from 'react';
import { Radio, Zap, Activity, Target, Box } from 'lucide-react';

const SystemDiagram = () => (
  <div className="bg-gray-750 p-4 rounded-lg">
    <h3 className="font-medium text-gray-100 mb-2">System Architecture</h3>
    <div className="relative h-40">
      {/* Asset A */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <Box className="w-12 h-12 text-purple-400 p-2 bg-gray-800 rounded-lg" />
          <span className="text-sm text-gray-300 mt-2">Asset A VM</span>
        </div>
      </div>

      {/* RF Simulator */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <Radio className="w-12 h-12 text-blue-400 p-2 bg-gray-800 rounded-lg" />
          <span className="text-sm text-gray-300 mt-2">RF Simulator</span>
        </div>
      </div>

      {/* Asset B */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <Box className="w-12 h-12 text-green-400 p-2 bg-gray-800 rounded-lg" />
          <span className="text-sm text-gray-300 mt-2">Asset B VM</span>
        </div>
      </div>

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <line
          x1="20%" y1="50%"
          x2="45%" y2="50%"
          className="stroke-gray-600"
          strokeWidth="2"
          strokeDasharray="4"
        />
        <line
          x1="55%" y1="50%"
          x2="80%" y2="50%"
          className="stroke-gray-600"
          strokeWidth="2"
          strokeDasharray="4"
        />

        <text x="30%" y="45%" className="fill-gray-400 text-xs">IQ Data</text>
        <text x="70%" y="45%" className="fill-gray-400 text-xs">Processed IQ</text>
      </svg>
    </div>
  </div>
);

const ChannelSimulatorInfo = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Radio className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-100">About the Channel Simulator</h2>
      </div>

      <div className="space-y-4 text-gray-300">
        <p>
          The RF Channel Simulator is a sophisticated system designed to replicate real-world satellite communication conditions.
          It processes IQ (In-phase/Quadrature) signals in real-time, applying various effects that signals encounter during
          space-to-ground transmission. By simulating atmospheric conditions, orbital dynamics, and signal propagation characteristics,
          it enables realistic testing and training scenarios for satellite communication systems.
        </p>

        <p>
          The simulator operates by intercepting IQ data between communication endpoints, processing it through configurable
          channel models that simulate real-world effects, and delivering the modified signal to the receiving system. This
          enables operators to experience and train for various communication scenarios and challenging conditions they may
          encounter during actual operations.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <h3 className="font-medium text-gray-100">Key Features</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Real-time IQ signal processing</li>
              <li>• Configurable channel effects</li>
              <li>• Dynamic parameter adjustment</li>
              <li>• Automatic visualisation generation</li>
              <li>• Support for multiple signal formats</li>
              <li>• Continuous data streaming</li>
              <li>• Low-latency processing</li>
            </ul>
          </div>

          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="font-medium text-gray-100">Capabilities</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Atmospheric attenuation simulation</li>
              <li>• Doppler shift effects</li>
              <li>• Multipath propagation</li>
              <li>• AWGN injection</li>
              <li>• Path loss modelling</li>
              <li>• Phase noise simulation</li>
              <li>• Rain fade effects</li>
            </ul>
          </div>

          <div className="bg-gray-750 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <h3 className="font-medium text-gray-100">Use Cases</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>• Operator training scenarios</li>
              <li>• Communication system testing</li>
              <li>• Weather impact assessment</li>
              <li>• Interference response training</li>
              <li>• Link margin verification</li>
              <li>• Protocol resilience testing</li>
              <li>• Failure mode analysis</li>
            </ul>
          </div>
        </div>

        <SystemDiagram />

        <div className="bg-gray-750 p-4 rounded-lg">
          <h3 className="font-medium text-gray-100 mb-2">How It Works</h3>
          <p>
            The RF Channel Simulator acts as an intermediary between two communication endpoints. When Asset A transmits data,
            it's captured as IQ samples and passed through the simulator. The simulator applies configured effects such as
            atmospheric attenuation, Doppler shift, and multipath propagation based on the current channel model settings.
            The processed IQ data is then forwarded to Asset B, creating a realistic simulation of space-based communication
            channel conditions. This enables accurate testing and training without the need for actual satellite links.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChannelSimulatorInfo;
