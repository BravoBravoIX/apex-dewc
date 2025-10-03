import { TrendingDown, TrendingUp } from 'lucide-react';

export interface SatelliteStatus {
  id: string;
  name: string;
  signalStrength: number; // 0-100
  linkQuality: string;
  status: 'nominal' | 'degraded' | 'critical';
  trend?: 'improving' | 'declining';
}

interface SatelliteStatusGridProps {
  satellites: SatelliteStatus[];
}

export const SatelliteStatusGrid = ({ satellites }: SatelliteStatusGridProps) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'nominal':
        return 'bg-success/15 text-success';
      case 'degraded':
        return 'bg-warning/15 text-warning';
      case 'critical':
        return 'bg-error/15 text-error';
      default:
        return 'bg-text-muted/15 text-text-muted';
    }
  };

  const getSignalBarClass = (strength: number) => {
    if (strength >= 70) return 'bg-gradient-to-r from-success to-green-400';
    if (strength >= 40) return 'bg-gradient-to-r from-warning to-yellow-400';
    return 'bg-gradient-to-r from-error to-orange-500';
  };

  if (satellites.length === 0) {
    return (
      <section className="mb-8">
        <div className="text-center py-8 text-text-secondary">
          No satellite data available
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {satellites.map((satellite) => (
          <div key={satellite.id} className="card p-6">
            {/* Satellite Name */}
            <h3 className="text-xl font-bold text-primary mb-4">
              {satellite.name}
            </h3>

            {/* Metrics */}
            <div className="space-y-4">
              {/* Signal Strength */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-text-secondary">Signal Strength</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {satellite.signalStrength}%
                  </span>
                </div>
                <div className="w-full h-6 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getSignalBarClass(satellite.signalStrength)} flex items-center justify-end px-2`}
                    style={{ width: `${satellite.signalStrength}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {satellite.signalStrength}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Link Quality */}
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Link Quality</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {satellite.linkQuality}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusBadgeClass(satellite.status)}`}>
                  {satellite.status}
                </span>
              </div>

              {/* Trend Indicator */}
              {satellite.trend && (
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-2">
                  {satellite.trend === 'improving' ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-success">Improving</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-error" />
                      <span className="text-error">Declining</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
