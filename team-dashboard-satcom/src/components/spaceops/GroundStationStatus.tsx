export interface GroundStation {
  id: string;
  name: string;
  location: string;
  signalQuality: number; // 0-100
  status: 'nominal' | 'degraded' | 'impaired';
}

interface GroundStationStatusProps {
  stations: GroundStation[];
}

export const GroundStationStatus = ({ stations }: GroundStationStatusProps) => {
  const getStatusBorderClass = (status: string) => {
    switch (status) {
      case 'nominal':
        return 'border-l-success';
      case 'degraded':
        return 'border-l-warning';
      case 'impaired':
        return 'border-l-error';
      default:
        return 'border-l-text-muted';
    }
  };

  if (stations.length === 0) {
    return (
      <section className="mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h2 className="text-lg font-semibold text-text-primary">
              Ground Station Status
            </h2>
          </div>
          <div className="text-center py-4 text-text-secondary">
            No ground station data available
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            Ground Station Status
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stations.map((station) => (
            <div
              key={station.id}
              className={`p-4 bg-background rounded-md border-l-4 ${getStatusBorderClass(station.status)}`}
            >
              {/* Station Name */}
              <div className="font-semibold text-text-primary mb-2">
                {station.name}
              </div>

              {/* Location */}
              {station.location && (
                <div className="text-xs text-text-muted mb-2">
                  {station.location}
                </div>
              )}

              {/* Signal Quality */}
              <div className="flex justify-between items-center text-sm text-text-secondary">
                <span>Signal Quality</span>
                <span className="font-semibold text-text-primary">
                  {station.signalQuality}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
