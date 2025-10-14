import { useState, useEffect } from 'react';
import { useInjects } from '../contexts/InjectContext';

export const RFControlPage = () => {
  const { publishInject } = useInjects();
  const [jammingPower, setJammingPower] = useState(-30);
  const [playbackState, setPlaybackState] = useState<'play' | 'pause' | 'stop'>('stop');
  const [iqFiles, setIqFiles] = useState<any[]>([]);
  const [selectedIqFile, setSelectedIqFile] = useState<string>('');

  useEffect(() => {
    // Fetch available IQ files
    fetch('/api/v1/iq-library')
      .then(res => res.json())
      .then(data => {
        setIqFiles(data.iq_files || []);
        if (data.iq_files?.length > 0) {
          setSelectedIqFile(data.iq_files[0].filename);
        }
      })
      .catch(err => console.error('Failed to load IQ files:', err));
  }, []);

  const sendCommand = (command: string, parameters?: Record<string, any>) => {
    publishInject({
      type: 'trigger',
      content: {
        command,
        parameters
      }
    });

    // Update local state for playback controls
    if (['play', 'pause', 'stop'].includes(command)) {
      setPlaybackState(command as 'play' | 'pause' | 'stop');
    }
  };

  const switchIqFile = () => {
    if (selectedIqFile) {
      sendCommand('switch_iq', { file: `/iq_files/${selectedIqFile}` });
    }
  };

  const playbackControls = [
    { label: 'Play', command: 'play', icon: '▶' },
    { label: 'Pause', command: 'pause', icon: '⏸' },
    { label: 'Stop', command: 'stop', icon: '⏹' },
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

      {/* IQ File Selection */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">IQ File Selection</h2>
        </div>
        <div className="card-content space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Select IQ File:
              </label>
              <select
                value={selectedIqFile}
                onChange={(e) => setSelectedIqFile(e.target.value)}
                className="w-full bg-surface-dark text-text-primary border border-surface-light rounded px-3 py-2"
              >
                {iqFiles.map((file) => (
                  <option key={file.filename} value={file.filename}>
                    {file.filename} ({file.size_mb} MB, {file.duration_seconds}s)
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={switchIqFile}
              className="btn btn-primary"
              disabled={!selectedIqFile}
            >
              Load File
            </button>
          </div>
          <p className="text-sm text-text-muted">
            <strong>Note:</strong> Switching files will briefly disconnect GQRX. Reconnect after loading.
          </p>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Playback Controls</h2>
        </div>
        <div className="card-content">
          <div className="flex gap-4">
            {playbackControls.map(({ label, command, icon }) => {
              const isActive = playbackState === command;
              return (
                <button
                  key={command}
                  onClick={() => sendCommand(command)}
                  className={`btn flex-1 transition-all ${
                    isActive
                      ? 'ring-4 ring-primary ring-opacity-50 bg-primary text-white scale-105'
                      : 'btn-secondary hover:bg-surface-light'
                  }`}
                >
                  <span className="text-2xl mr-2">{icon}</span>
                  <span className="font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
              playbackState === 'play' ? 'bg-green-500/20 text-green-400' :
              playbackState === 'pause' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              Status: {playbackState.toUpperCase()}
            </div>
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
