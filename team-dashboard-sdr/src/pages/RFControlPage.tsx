import { useState } from 'react';
import { useInjects } from '../contexts/InjectContext';

export const RFControlPage = () => {
  const { publishInject } = useInjects();
  const [jammingPower, setJammingPower] = useState(-30);

  const sendCommand = (command: string, parameters?: Record<string, any>) => {
    publishInject({
      type: 'trigger',
      content: {
        command,
        parameters
      }
    });
  };

  const playbackControls = [
    { label: 'Play', command: 'play', color: 'btn-success' },
    { label: 'Pause', command: 'pause', color: 'btn-warning' },
    { label: 'Stop', command: 'stop', color: 'btn-error' },
  ];

  const jammingTypes = [
    { label: 'CW Tone', command: 'jamming_cw', description: 'Continuous wave jamming' },
    { label: 'Noise', command: 'jamming_noise', description: 'Wideband noise' },
    { label: 'Sweep', command: 'jamming_sweep', description: 'Frequency sweep' },
    { label: 'Pulse', command: 'jamming_pulse', description: 'Pulsed jamming' },
    { label: 'Chirp', command: 'jamming_chirp', description: 'Linear FM chirp' },
  ];

  return (
    <div className="space-y-6">
      <div className="text-3xl font-bold text-text-primary">RF Spectrum Control</div>

      {/* GQRX Connection Card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">GQRX Connection</h2>
        </div>
        <div className="card-content space-y-4">
          <div className="bg-surface-dark p-4 rounded-lg">
            <h3 className="font-semibold text-text-primary mb-2">Connection Settings:</h3>
            <div className="space-y-2 text-sm text-text-muted font-mono">
              <div className="flex justify-between">
                <span>Host:</span>
                <span className="text-text-primary">localhost</span>
              </div>
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="text-text-primary">1234</span>
              </div>
              <div className="flex justify-between">
                <span>Protocol:</span>
                <span className="text-text-primary">RTL-TCP</span>
              </div>
              <div className="flex justify-between">
                <span>Sample Rate:</span>
                <span className="text-text-primary">1.024 MHz</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-text-muted">
            <p className="mb-2"><strong>Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open GQRX</li>
              <li>Go to File → I/O Devices</li>
              <li>Select "RTL-TCP" as device</li>
              <li>Enter "localhost:1234" as server</li>
              <li>Click "OK" and start DSP</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Playback Controls</h2>
        </div>
        <div className="card-content">
          <div className="flex gap-4">
            {playbackControls.map(({ label, command, color }) => (
              <button
                key={command}
                onClick={() => sendCommand(command)}
                className={`btn ${color} flex-1`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jamming Controls */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Jamming Controls</h2>
        </div>
        <div className="card-content space-y-6">
          {/* Power Control */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Jamming Power: {jammingPower} dB
            </label>
            <input
              type="range"
              min="-50"
              max="-10"
              step="1"
              value={jammingPower}
              onChange={(e) => setJammingPower(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>-50 dB (Weak)</span>
              <span>-10 dB (Strong)</span>
            </div>
          </div>

          {/* Jamming Type Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {jammingTypes.map(({ label, command, description }) => (
              <button
                key={command}
                onClick={() => sendCommand(command, { power_db: jammingPower })}
                className="btn btn-error text-left flex flex-col"
              >
                <span className="font-semibold">{label}</span>
                <span className="text-xs opacity-80">{description}</span>
              </button>
            ))}
            <button
              onClick={() => sendCommand('jamming_clear')}
              className="btn btn-secondary col-span-2"
            >
              Clear All Jamming
            </button>
          </div>
        </div>
      </div>

      {/* Signal Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Demo Signal Information</h2>
        </div>
        <div className="card-content">
          <div className="bg-surface-dark p-4 rounded-lg">
            <p className="text-sm text-text-muted mb-3">
              The demo IQ file contains 4 carrier tones for testing:
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Tone 1:</span>
                <span className="text-text-primary font-mono">-100 kHz (Strong)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tone 2:</span>
                <span className="text-text-primary font-mono">0 kHz (Medium)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tone 3:</span>
                <span className="text-text-primary font-mono">+150 kHz (Weak)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Tone 4:</span>
                <span className="text-text-primary font-mono">+250 kHz (Very Weak)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
