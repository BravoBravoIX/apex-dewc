import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useMqtt } from '../hooks/useMqtt';
import type { SatelliteStatus } from '../components/spaceops/SatelliteStatusGrid';
import type { GroundStation } from '../components/spaceops/GroundStationStatus';
import type { SignalDataPoint } from '../components/spaceops/SignalHistoryChart';
import type { SpectrumBar } from '../components/ew-intel/SpectrumAnalyzer';
import type { ThreatData } from '../components/ew-intel/ThreatClassification';
import type { GeolocationData } from '../components/ew-intel/EmitterGeolocation';
import type { Countermeasure } from '../components/ew-intel/CountermeasuresList';

export interface Inject {
  id: string;
  time: number;
  type?: string;
  content?: string | {
    headline?: string;
    body?: string;
    source?: string;
    from?: string;
    to?: string;
    subject?: string;
    command?: string;
    parameters?: any;
  };
  message?: string;
  data?: any;
  delivered_at?: number;
  team_id?: string;
  exercise_id?: string;
  media?: string[];
  action?: {
    type: string;
    data?: any;
  };
}

interface InjectContextType {
  injects: Inject[];
  timer: string;
  exerciseState: 'RUNNING' | 'PAUSED' | 'STOPPED';
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: Date | null;

  // SpaceOps state
  satellites: SatelliteStatus[];
  groundStations: GroundStation[];
  signalHistory: SignalDataPoint[];
  recommendation: string | null;

  // EW-Intel state
  spectrumData: SpectrumBar[];
  threatData: ThreatData | null;
  geolocationData: GeolocationData | null;
  countermeasures: Countermeasure[];
  effectiveness: string | null;
}

const InjectContext = createContext<InjectContextType | undefined>(undefined);

export const InjectProvider = ({ children }: { children: ReactNode }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team') || 'default-team';
  const exerciseName = urlParams.get('exercise') || 'test';
  const topic = `/exercise/${exerciseName}/team/${teamId}/feed`;

  const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
  const brokerUrl = `ws://${hostname}:9001`;

  const timerTopic = `/exercise/${exerciseName}/timer`;
  const controlTopic = `/exercise/${exerciseName}/control`;

  const mqttTopics = useMemo(() => [topic, timerTopic, controlTopic], [topic, timerTopic, controlTopic]);
  const { messages, connectionStatus } = useMqtt(brokerUrl, mqttTopics);

  const [timer, setTimer] = useState<string>('T+00:00');
  const [injects, setInjects] = useState<Inject[]>([]);
  const [exerciseState, setExerciseState] = useState<'RUNNING' | 'PAUSED' | 'STOPPED'>('RUNNING');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // SpaceOps state
  const [satellites, setSatellites] = useState<SatelliteStatus[]>([]);
  const [groundStations, setGroundStations] = useState<GroundStation[]>([]);
  const [signalHistory, setSignalHistory] = useState<SignalDataPoint[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  // EW-Intel state
  const [spectrumData, setSpectrumData] = useState<SpectrumBar[]>([]);
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [geolocationData, setGeolocationData] = useState<GeolocationData | null>(null);
  const [countermeasures, setCountermeasures] = useState<Countermeasure[]>([]);
  const [effectiveness, setEffectiveness] = useState<string | null>(null);

  // Handle inject-driven updates
  const handleInject = (inject: Inject) => {
    const injectType = inject.type?.toLowerCase() || inject.action?.type?.toLowerCase();

    // Handle command-based injects from scenario timelines
    if (injectType === 'trigger' && inject.content && typeof inject.content === 'object' && 'command' in inject.content) {
      const command = inject.content.command;
      const params = inject.content.parameters || {};

      switch (command) {
        // SpaceOps commands
        case 'initialize_satellites':
          if (params.satellites) {
            const sats = params.satellites.map((sat: any) => ({
              id: sat.name,
              name: sat.name,
              signalStrength: sat.signal_strength || 0,
              linkQuality: sat.uplink_status || 'Unknown',
              status: sat.status?.toLowerCase() || 'unknown'
            }));
            setSatellites(sats);
          }
          return;

        case 'update_satellite_status':
          if (params.satellite) {
            setSatellites(prev => {
              const index = prev.findIndex(s => s.name === params.satellite);
              const updated = [...prev];
              const satellite = {
                id: params.satellite,
                name: params.satellite,
                signalStrength: params.signal_strength,
                linkQuality: params.status || 'Unknown',
                status: params.status?.toLowerCase().replace('_', '') || 'unknown',
                trend: params.trend as 'improving' | 'declining' | undefined
              };

              if (index >= 0) {
                updated[index] = { ...updated[index], ...satellite };
              } else {
                updated.push(satellite);
              }

              // Add to signal history
              if (params.signal_strength !== undefined) {
                const now = new Date();
                const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                setSignalHistory(prev => [...prev, { timestamp, value: params.signal_strength }].slice(-20));
              }

              // Handle recommendation
              if (params.recommendation) {
                setRecommendation(params.recommendation);
              }

              return updated;
            });
          }
          return;

        case 'update_ground_stations':
          if (params.stations) {
            const stations = params.stations.map((st: any) => ({
              id: st.name,
              name: st.name,
              location: st.location || '',
              signalQuality: st.link_quality || 0,
              status: st.status?.toLowerCase() || 'unknown'
            }));
            setGroundStations(stations);
          }
          return;

        case 'countermeasure_available':
          if (params.description) {
            setRecommendation(params.description);
          }
          return;

        // EW-Intel commands
        case 'initialize_spectrum':
          // Initialize with baseline spectrum
          const bars = Array.from({ length: 50 }, (_, i) => ({
            frequency: 7.25 + (i / 49) * (8.40 - 7.25),
            amplitude: Math.random() * 20 + 10,
            isInterference: false
          }));
          setSpectrumData(bars);
          return;

        case 'spectrum_anomaly':
        case 'inject_interference':
          // Update spectrum with interference
          setSpectrumData(prev => {
            if (prev.length === 0) {
              // Initialize if empty
              return Array.from({ length: 50 }, (_, i) => {
                const freq = 7.25 + (i / 49) * (8.40 - 7.25);
                const isNearTarget = params.frequency_ghz && Math.abs(freq - params.frequency_ghz) < 0.1;
                return {
                  frequency: freq,
                  amplitude: isNearTarget ? 80 + Math.random() * 15 : Math.random() * 20 + 10,
                  isInterference: isNearTarget
                };
              });
            }

            // Update existing
            return prev.map(bar => {
              const isNearTarget = params.frequency_ghz && Math.abs(bar.frequency - params.frequency_ghz) < 0.1;
              return {
                ...bar,
                amplitude: isNearTarget ? 80 + Math.random() * 15 : bar.amplitude,
                isInterference: isNearTarget
              };
            });
          });
          return;

        case 'classify_emitter':
          setThreatData({
            emitterType: params.emitter_type || 'Unknown',
            threatCategory: params.threat_category || 'Unknown',
            confidenceLevel: params.confidence || 0,
            characteristics: params.characteristics ? Object.entries(params.characteristics).map(([label, value]) => ({
              label: label.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              value: String(value)
            })) : undefined
          });
          return;

        case 'geolocation_update':
        case 'geolocation_refined':
          setGeolocationData({
            latitude: params.latitude ? `${params.latitude.toFixed(4)}°N` : '--',
            longitude: params.longitude ? `${params.longitude.toFixed(4)}°E` : '--',
            altitude: params.altitude_meters ? `${params.altitude_meters}m` : '--',
            method: params.method || '--',
            confidence: params.confidence ? `${params.confidence}%` : '--',
            errorRadius: params.error_radius_km ? `${params.error_radius_km}km` : '--',
            nearestLandmark: params.nearest_landmark
          });
          return;

        case 'threat_database_match':
          setThreatData(prev => ({
            ...prev,
            emitterType: prev?.emitterType || 'Unknown',
            threatCategory: prev?.threatCategory || 'Unknown',
            confidenceLevel: prev?.confidenceLevel || 0,
            systemName: params.system_name,
            natoDesignation: params.nato_designation,
            manufacturer: params.manufacturer,
            characteristics: prev?.characteristics
          }));

          if (params.countermeasures) {
            setCountermeasures(params.countermeasures.map((cm: string, idx: number) => ({
              id: `cm-${idx}`,
              description: cm
            })));
          }
          return;

        case 'jamming_effectiveness':
          if (params.status && params.reason) {
            setEffectiveness(`${params.status}: ${params.reason} (${params.effectiveness_percent}% effective)`);
          }
          return;
      }
    }

    switch (injectType) {
      // SpaceOps inject types
      case 'satellite_status':
        if (inject.data) {
          setSatellites(prev => {
            const index = prev.findIndex(s => s.id === inject.data.id || s.name === inject.data.name);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...inject.data };
              return updated;
            }
            return [...prev, inject.data];
          });

          // Add to signal history if signal strength is present
          if (inject.data.signalStrength !== undefined) {
            const now = new Date();
            const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            setSignalHistory(prev => [...prev, { timestamp, value: inject.data.signalStrength }].slice(-20));
          }
        }
        break;

      case 'ground_station':
        if (inject.data) {
          setGroundStations(prev => {
            const index = prev.findIndex(s => s.id === inject.data.id || s.name === inject.data.name);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...inject.data };
              return updated;
            }
            return [...prev, inject.data];
          });
        }
        break;

      case 'recommendation':
      case 'countermeasure_recommendation':
        if (inject.data?.recommendation || inject.message) {
          setRecommendation(inject.data?.recommendation || inject.message);
        }
        break;

      // EW-Intel inject types
      case 'spectrum_data':
      case 'spectrum':
        if (inject.data?.bars || inject.data?.spectrum) {
          const bars = inject.data.bars || inject.data.spectrum;
          const interferenceIndices = inject.data.interferenceIndices || inject.data.interference || [];

          const spectrumBars: SpectrumBar[] = bars.map((amplitude: number, index: number) => ({
            frequency: 7.25 + (index / bars.length) * (8.40 - 7.25),
            amplitude,
            isInterference: interferenceIndices.includes(index)
          }));

          setSpectrumData(spectrumBars);
        }
        break;

      case 'threat_analysis':
      case 'threat':
        if (inject.data) {
          setThreatData({
            emitterType: inject.data.emitterType || 'Unknown',
            threatCategory: inject.data.threatCategory || 'Unknown',
            confidenceLevel: inject.data.confidenceLevel || 0,
            systemName: inject.data.systemName,
            natoDesignation: inject.data.natoDesignation,
            manufacturer: inject.data.manufacturer,
            characteristics: inject.data.characteristics
          });
        }
        break;

      case 'geolocation':
      case 'emitter_geolocation':
        if (inject.data) {
          setGeolocationData(inject.data);
        }
        break;

      case 'countermeasure':
      case 'countermeasures':
        if (inject.data?.countermeasures) {
          setCountermeasures(inject.data.countermeasures);
        } else if (inject.data?.description) {
          setCountermeasures([inject.data]);
        }
        break;

      case 'effectiveness':
      case 'jamming_effectiveness':
        if (inject.data?.effectiveness || inject.message) {
          setEffectiveness(inject.data?.effectiveness || inject.message);
        }
        break;
    }
  };

  useEffect(() => {
    messages.forEach(msg => {
      try {
        const parsed = JSON.parse(msg);

        if (parsed.formatted && parsed.elapsed !== undefined) {
          setTimer(parsed.formatted);
          setLastUpdate(new Date());
        } else if (parsed.command) {
          switch (parsed.command) {
            case 'pause':
              setExerciseState('PAUSED');
              break;
            case 'resume':
              setExerciseState('RUNNING');
              break;
            case 'stop':
              setExerciseState('STOPPED');
              break;
          }
        } else if (parsed.id) {
          setInjects(prev => {
            const exists = prev.some(inject => inject.id === parsed.id);
            if (exists) return prev;
            return [parsed, ...prev];
          });

          // Handle inject-driven updates
          handleInject(parsed);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });
  }, [messages]);

  return (
    <InjectContext.Provider
      value={{
        injects,
        timer,
        exerciseState,
        connectionStatus,
        lastUpdate,
        satellites,
        groundStations,
        signalHistory,
        recommendation,
        spectrumData,
        threatData,
        geolocationData,
        countermeasures,
        effectiveness,
      }}
    >
      {children}
    </InjectContext.Provider>
  );
};

export const useInjects = () => {
  const context = useContext(InjectContext);
  if (!context) {
    throw new Error('useInjects must be used within InjectProvider');
  }
  return context;
};
