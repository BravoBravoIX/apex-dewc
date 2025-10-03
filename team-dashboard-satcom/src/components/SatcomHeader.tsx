import { useInjects } from '../contexts/InjectContext';
import { ThemeToggle } from './ThemeToggle';
import { useEffect, useState } from 'react';

interface SatcomHeaderProps {
  teamId: string;
}

export const SatcomHeader = ({ teamId }: SatcomHeaderProps) => {
  const { timer, exerciseState, connectionStatus } = useInjects();
  const [utcTime, setUtcTime] = useState('--:--:--');

  // Update UTC time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get team-specific title and subtitle
  const getTeamInfo = () => {
    switch (teamId) {
      case 'spaceops':
        return {
          title: 'Space Operations Center',
          subtitle: 'SATCOM Network Monitoring'
        };
      case 'ew-intel':
        return {
          title: 'Electronic Warfare Intelligence',
          subtitle: 'RF Spectrum Analysis & Threat Characterization'
        };
      default:
        return {
          title: 'SATCOM Dashboard',
          subtitle: 'Space Cyber Operations'
        };
    }
  };

  const teamInfo = getTeamInfo();

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'connecting': return 'bg-warning';
      case 'reconnecting': return 'bg-warning';
      case 'disconnected': return 'bg-error';
      default: return 'bg-text-muted';
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  const getExerciseStateColor = () => {
    switch (exerciseState) {
      case 'RUNNING': return 'text-success';
      case 'PAUSED': return 'text-warning';
      case 'STOPPED': return 'text-error';
      default: return 'text-text-muted';
    }
  };

  return (
    <header className="bg-header-bg border-b-2 border-header-border shadow-sm">
      <div className="px-8 py-4 flex items-center justify-between">
        {/* Left side: APEX branding + team title */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-bold text-primary">APEX</div>
            <div className="text-xs text-text-muted uppercase tracking-wide">
              Advanced Platform for Exercise & eXperimentation
            </div>
          </div>
          <div className="h-12 w-px bg-border"></div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              {teamInfo.title}
            </h1>
            <div className="text-sm text-text-secondary mt-0.5">
              {teamInfo.subtitle}
            </div>
          </div>
        </div>

        {/* Right side: Status items + theme toggle */}
        <div className="flex items-center gap-6">
          {/* Exercise Timer */}
          <div className="text-right">
            <div className="text-xs text-text-muted uppercase tracking-wide">
              Exercise Timer
            </div>
            <div className="text-lg font-medium text-text-primary font-mono">
              {timer}
            </div>
            <div className={`text-xs font-semibold ${getExerciseStateColor()}`}>
              {exerciseState}
            </div>
          </div>

          {/* UTC Time */}
          <div className="text-right">
            <div className="text-xs text-text-muted uppercase tracking-wide">
              UTC Time
            </div>
            <div className="text-lg font-medium text-text-primary font-mono">
              {utcTime}
            </div>
          </div>

          {/* Connection Status */}
          <div className="text-right">
            <div className="text-xs text-text-muted uppercase tracking-wide">
              Connection
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className={`w-2 h-2 rounded-full transition-all ${getConnectionColor()}`}></div>
              <div className="text-lg font-medium text-text-primary">
                {getConnectionText()}
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
