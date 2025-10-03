import { SatcomHeader } from '../components/SatcomHeader';
import { SatelliteStatusGrid } from '../components/spaceops/SatelliteStatusGrid';
import { GroundStationStatus } from '../components/spaceops/GroundStationStatus';
import { SignalHistoryChart } from '../components/spaceops/SignalHistoryChart';
import { RecommendationsPanel } from '../components/spaceops/RecommendationsPanel';
import { useInjects } from '../contexts/InjectContext';

export const SpaceOpsPage = () => {
  const {
    satellites,
    groundStations,
    signalHistory,
    recommendation,
  } = useInjects();

  return (
    <div className="min-h-screen bg-background">
      <SatcomHeader teamId="spaceops" />

      <main className="max-w-[1600px] mx-auto p-8">
        {/* Recommendations Panel (shows when available) */}
        <RecommendationsPanel recommendation={recommendation} />

        {/* Satellite Status Grid */}
        <SatelliteStatusGrid satellites={satellites} />

        {/* Ground Station Status */}
        <GroundStationStatus stations={groundStations} />

        {/* Signal History Chart */}
        <SignalHistoryChart data={signalHistory} />
      </main>
    </div>
  );
};
