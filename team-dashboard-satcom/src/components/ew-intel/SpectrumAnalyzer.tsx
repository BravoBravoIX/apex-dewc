import { useEffect, useState } from 'react';

export interface SpectrumBar {
  frequency: number;
  amplitude: number; // 0-100
  isInterference: boolean;
}

interface SpectrumAnalyzerProps {
  data: SpectrumBar[];
  frequencyRange?: { min: number; max: number; unit: string };
}

export const SpectrumAnalyzer = ({
  data,
  frequencyRange = { min: 7.25, max: 8.40, unit: 'GHz' }
}: SpectrumAnalyzerProps) => {
  const [animatedData, setAnimatedData] = useState<SpectrumBar[]>(data);

  // Animate data changes
  useEffect(() => {
    setAnimatedData(data);
  }, [data]);

  const getBarHeight = (amplitude: number) => {
    return `${amplitude}%`;
  };

  const getBarColor = (bar: SpectrumBar) => {
    if (bar.isInterference) {
      return 'bg-gradient-to-t from-error via-red-600 to-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]';
    }

    // Normal gradient from green to orange to red
    if (bar.amplitude >= 70) {
      return 'bg-gradient-to-t from-success via-warning to-error';
    } else if (bar.amplitude >= 40) {
      return 'bg-gradient-to-t from-success to-warning';
    } else {
      return 'bg-gradient-to-t from-success to-green-400';
    }
  };

  if (data.length === 0) {
    return (
      <section className="mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              RF Spectrum Monitor
            </h2>
          </div>
          <div className="h-[280px] flex items-center justify-center text-text-secondary">
            No spectrum data available
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            RF Spectrum Monitor
          </h2>
          <div className="text-sm text-text-secondary">
            {frequencyRange.min} - {frequencyRange.max} {frequencyRange.unit} (X-Band SATCOM)
          </div>
        </div>

        {/* Spectrum Display */}
        <div className="bg-black/80 rounded-lg p-8 relative overflow-hidden">
          {/* Spectrum Bars */}
          <div className="flex items-end justify-around h-[200px] gap-0.5">
            {animatedData.map((bar, index) => (
              <div
                key={index}
                className={`flex-1 rounded-t transition-all duration-300 ease-out min-h-[2px] ${getBarColor(bar)}`}
                style={{ height: getBarHeight(bar.amplitude) }}
              />
            ))}
          </div>

          {/* Frequency Labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{frequencyRange.min} {frequencyRange.unit}</span>
            <span>{((frequencyRange.min + frequencyRange.max) / 2).toFixed(2)} {frequencyRange.unit}</span>
            <span>{frequencyRange.max} {frequencyRange.unit}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-t from-success to-warning"></div>
            <span className="text-text-secondary">Normal Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-t from-error to-red-500"></div>
            <span className="text-text-secondary">Interference Detected</span>
          </div>
        </div>
      </div>
    </section>
  );
};
