import { SatcomHeader } from '../components/SatcomHeader';
import { SpectrumAnalyzer } from '../components/ew-intel/SpectrumAnalyzer';
import { ThreatClassification } from '../components/ew-intel/ThreatClassification';
import { EmitterGeolocation } from '../components/ew-intel/EmitterGeolocation';
import { CountermeasuresList } from '../components/ew-intel/CountermeasuresList';
import { EffectivenessBanner } from '../components/ew-intel/EffectivenessBanner';
import { useInjects } from '../contexts/InjectContext';

export const EWIntelPage = () => {
  const {
    spectrumData,
    threatData,
    geolocationData,
    countermeasures,
    effectiveness,
  } = useInjects();

  return (
    <div className="min-h-screen bg-background">
      <SatcomHeader teamId="ew-intel" />

      <main className="max-w-[1600px] mx-auto p-8">
        {/* RF Spectrum Display */}
        <SpectrumAnalyzer data={spectrumData} />

        {/* Threat Classification Panel (2 columns) */}
        <ThreatClassification threat={threatData} />

        {/* Emitter Geolocation */}
        <EmitterGeolocation geolocation={geolocationData} />

        {/* Countermeasures */}
        <CountermeasuresList countermeasures={countermeasures} />

        {/* Jamming Effectiveness (shows when available) */}
        <EffectivenessBanner effectiveness={effectiveness} />
      </main>
    </div>
  );
};
